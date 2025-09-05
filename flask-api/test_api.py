#!/usr/bin/env python3
"""
Test script for YouTube to MP3 API
"""

import requests
import json

# API endpoint
BASE_URL = "http://localhost:5000"

def test_health_check():
    """Test the health check endpoint"""
    print("Testing health check endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        print(f"Health check status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_convert_api():
    """Test the convert endpoint with a sample video"""
    print("\nTesting convert endpoint...")
    
    # Test data - using a short, publicly available video
    test_data = {
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",  # Rick Roll (for testing)
        "bitrate": 128
    }
    
    try:
        print("Sending conversion request...")
        response = requests.post(
            f"{BASE_URL}/api/convert",
            json=test_data,
            stream=True
        )
        
        print(f"Conversion status: {response.status_code}")
        
        if response.status_code == 200:
            # Save the file
            filename = "test_output.mp3"
            with open(filename, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            print(f"✓ Conversion successful! File saved as {filename}")
            return True
        else:
            print(f"✗ Conversion failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"✗ Conversion test failed: {e}")
        return False

def test_invalid_inputs():
    """Test API with invalid inputs"""
    print("\nTesting invalid inputs...")
    
    test_cases = [
        {"url": "", "bitrate": 128},  # Empty URL
        {"url": "https://example.com", "bitrate": 128},  # Invalid URL
        {"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "bitrate": 500},  # Invalid bitrate
        {"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "bitrate": "invalid"},  # Invalid bitrate type
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        try:
            response = requests.post(f"{BASE_URL}/api/convert", json=test_case)
            if response.status_code == 400:
                print(f"✓ Test case {i}: Correctly rejected invalid input")
            else:
                print(f"✗ Test case {i}: Should have rejected invalid input (got {response.status_code})")
        except Exception as e:
            print(f"✗ Test case {i} failed: {e}")

if __name__ == "__main__":
    print("YouTube to MP3 API Test Suite")
    print("=" * 40)
    
    # Test health check
    if test_health_check():
        print("✓ API is running")
    else:
        print("✗ API is not responding")
        exit(1)
    
    # Test invalid inputs
    test_invalid_inputs()
    
    # Test conversion (optional - requires internet)
    user_input = input("\nDo you want to test actual video conversion? (y/N): ")
    if user_input.lower() == 'y':
        test_convert_api()
    
    print("\nTest suite completed!")
