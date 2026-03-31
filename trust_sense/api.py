"""
Trust Sense API - REST API for Trust Analysis
Provides endpoints for multimodal trust analysis
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from typing import Dict, Any, Optional
import logging
import base64
import io

from .engine import TrustEngine

logger = logging.getLogger(__name__)

class TrustAPI:
    def __init__(self, engine: TrustEngine, host: str = "0.0.0.0", port: int = 8000):
        self.engine = engine
        self.host = host
        self.port = port
        
        self.app = Flask(__name__)
        CORS(self.app)
        
        self._setup_routes()
    
    def _setup_routes(self):
        """Setup API routes"""
        
        @self.app.route('/health', methods=['GET'])
        def health():
            return jsonify({'status': 'healthy', 'service': 'trust-sense'})
        
        @self.app.route('/analyze', methods=['POST'])
        def analyze():
            """Analyze content for trust"""
            try:
                data = request.get_json()
                
                if not data:
                    return jsonify({'error': 'No data provided'}), 400
                
                # Extract modalities
                content = {}
                modalities = data.get('modalities', ['text', 'image', 'video', 'audio'])
                
                if 'text' in data:
                    content['text'] = data['text']
                
                if 'image' in data:
                    # Handle base64 encoded image
                    if data['image'].startswith('data:image'):
                        # Remove data URL prefix
                        image_data = data['image'].split(',')[1]
                        content['image'] = base64.b64decode(image_data)
                    else:
                        content['image'] = data['image']
                
                if 'video' in data:
                    content['video'] = data['video']
                
                if 'audio' in data:
                    content['audio'] = data['audio']
                
                # Analyze
                result = self.engine.analyze_content(content, modalities)
                
                return jsonify(result)
            
            except Exception as e:
                logger.error(f"Analysis error: {e}")
                return jsonify({'error': str(e)}), 500
        
        @self.app.route('/analyze/stream', methods=['POST'])
        def analyze_stream():
            """Start real-time analysis stream"""
            try:
                data = request.get_json()
                stream_id = data.get('stream_id', 'default')
                
                # In a real implementation, this would set up WebSocket or SSE
                # For now, return stream configuration
                return jsonify({
                    'stream_id': stream_id,
                    'status': 'started',
                    'websocket_url': f'ws://{self.host}:{self.port}/ws/{stream_id}'
                })
            
            except Exception as e:
                logger.error(f"Stream setup error: {e}")
                return jsonify({'error': str(e)}), 500
        
        @self.app.route('/train', methods=['POST'])
        def train():
            """Train the model with new data"""
            try:
                data = request.get_json()
                
                if not data or 'training_data' not in data:
                    return jsonify({'error': 'No training data provided'}), 400
                
                training_data = data['training_data']
                validation_data = data.get('validation_data')
                
                # Train model
                history = self.engine.train_model(training_data, validation_data)
                
                return jsonify({
                    'status': 'training_completed',
                    'history': history
                })
            
            except Exception as e:
                logger.error(f"Training error: {e}")
                return jsonify({'error': str(e)}), 500
        
        @self.app.route('/config', methods=['GET', 'POST'])
        def config():
            """Get or update engine configuration"""
            if request.method == 'GET':
                return jsonify(self.engine.config)
            else:
                try:
                    new_config = request.get_json()
                    self.engine.config.update(new_config)
                    return jsonify({'status': 'config_updated', 'config': self.engine.config})
                except Exception as e:
                    return jsonify({'error': str(e)}), 500
    
    def run(self, debug: bool = False):
        """Run the API server"""
        logger.info(f"Starting Trust Sense API on {self.host}:{self.port}")
        self.app.run(host=self.host, port=self.port, debug=debug, threaded=True)
    
    def run_async(self):
        """Run the API server asynchronously"""
        from werkzeug.serving import make_server
        server = make_server(self.host, self.port, self.app, threaded=True)
        server.serve_forever()

# CLI interface
def main():
    """CLI entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Trust Sense API Server')
    parser.add_argument('--host', default='0.0.0.0', help='Host to bind to')
    parser.add_argument('--port', type=int, default=8000, help='Port to bind to')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    
    args = parser.parse_args()
    
    # Initialize engine
    engine = TrustEngine()
    
    # Create and run API
    api = TrustAPI(engine, args.host, args.port)
    api.run(args.debug)

if __name__ == '__main__':
    main()