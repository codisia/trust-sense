"""HeyGen video generation integration."""

import os
import time
from typing import Dict, Any, Optional

try:
    import requests
except ImportError:  # pragma: no cover
    requests = None


HEYGEN_API_URL = os.getenv("HEYGEN_API_URL", "https://api.heygen.com/v1")


class HeyGenError(Exception):
    pass


def generate_video(script: str, language: str = "en", avatar: str = "newscaster", voice: str = "default") -> Dict[str, Any]:
    """Generate a video using HeyGen.

    Returns a dict containing:
      - video_url: public URL (if available)
      - local_path: local file path (if downloaded)
      - metadata: raw API response
    """
    if requests is None:
        raise ImportError("requests is required for HeyGen integration. Install with `pip install requests`.")

    api_key = os.getenv("HEYGEN_API_KEY")
    if not api_key:
        raise HeyGenError("HEYGEN_API_KEY environment variable is required")

    # Build payload
    payload: Dict[str, Any] = {
        "script": script,
        "language": language,
        "avatar": avatar,
        "voice": voice,
        # Ensure output is downloadable
        "output_format": "mp4",
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    create_url = f"{HEYGEN_API_URL}/videos"
    resp = requests.post(create_url, json=payload, headers=headers, timeout=30)
    if resp.status_code not in (200, 201):
        raise HeyGenError(f"HeyGen creation failed: {resp.status_code} {resp.text}")
    data = resp.json()

    # If the API returns a job id, poll for completion
    job_id = data.get("id") or data.get("job_id")
    video_url = data.get("video_url") or data.get("url")

    if job_id and not video_url:
        # Poll until ready
        status_url = f"{HEYGEN_API_URL}/videos/{job_id}"
        for _ in range(60):
            time.sleep(5)
            status_resp = requests.get(status_url, headers=headers, timeout=30)
            if status_resp.status_code != 200:
                continue
            status_data = status_resp.json()
            if status_data.get("status") in ("completed", "ready"):
                video_url = status_data.get("video_url") or status_data.get("url")
                break

    result: Dict[str, Any] = {"metadata": data, "video_url": video_url}

    # Optionally download local copy
    download_dir = os.getenv("AI_NEWS_VIDEO_DIR", "./videos")
    try:
        os.makedirs(download_dir, exist_ok=True)
    except Exception:
        pass

    if video_url:
        try:
            file_resp = requests.get(video_url, stream=True, timeout=60)
            file_resp.raise_for_status()
            local_path = os.path.join(download_dir, f"heygens_{int(time.time())}.mp4")
            with open(local_path, "wb") as f:
                for chunk in file_resp.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            result["local_path"] = local_path
        except Exception:
            # ignore download failures, keep URL
            result["local_path"] = None

    return result
