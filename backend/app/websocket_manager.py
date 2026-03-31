"""
WebSocket manager for live alerts and real-time updates.
Connect to /ws/live for analysis completion, system alerts, etc.
"""
import json
from typing import Set
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self.active_connections.discard(websocket)

    async def broadcast(self, message: dict) -> None:
        payload = json.dumps(message) if isinstance(message, dict) else message
        dead = set()
        for conn in self.active_connections:
            try:
                await conn.send_text(payload)
            except Exception:
                dead.add(conn)
        for conn in dead:
            self.active_connections.discard(conn)

    async def send_personal(self, websocket: WebSocket, message: dict) -> None:
        payload = json.dumps(message) if isinstance(message, dict) else message
        try:
            await websocket.send_text(payload)
        except Exception:
            self.active_connections.discard(websocket)


ws_manager = ConnectionManager()
