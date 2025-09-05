'use client';

import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from './config/api';

export default function Home() {
  const [url, setUrl] = useState('');
  const [bitrate, setBitrate] = useState(128);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState('checking');
  const [step, setStep] = useState('input'); // 'input', 'info', 'downloading'
  const [videoInfo, setVideoInfo] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');

  const bitrateOptions = [64, 128, 192, 256, 320];

  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.health);
      if (response.ok) {
        setApiStatus('online');
      } else {
        setApiStatus('offline');
      }
    } catch (err) {
      setApiStatus('offline');
    }
  };

  const handleGetVideoInfo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(API_ENDPOINTS.videoInfo, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        const info = await response.json();
        setVideoInfo(info);
        setStep('info');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch video info');
      }
    } catch (err) {
      setError('Network error while fetching video info');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setStep('downloading');
    setProgress(0);
    setProgressText('Initializing...');
    setError('');

    try {
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        currentProgress += Math.random() * 15;
        if (currentProgress >= 95) {
          currentProgress = 95;
          setProgressText('Finalizing...');
        } else if (currentProgress >= 80) {
          setProgressText('Converting to MP3...');
        } else if (currentProgress >= 50) {
          setProgressText('Downloading video...');
        } else if (currentProgress >= 20) {
          setProgressText('Processing video...');
        }
        setProgress(Math.min(currentProgress, 95));
      }, 500);

      const response = await fetch(API_ENDPOINTS.convert, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, bitrate }),
      });

      clearInterval(progressInterval);

      if (response.ok) {
        setProgress(100);
        setProgressText('Download completed!');
        
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${videoInfo.title.substring(0, 50)}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(downloadUrl);
        
        setTimeout(() => {
          setStep('input');
          setUrl('');
          setVideoInfo(null);
          setProgress(0);
          setProgressText('');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Download failed');
        setStep('info');
      }
    } catch (err) {
      setError('Network error during download');
      setStep('info');
    }
  };

  const handleBack = () => {
    setStep('input');
    setVideoInfo(null);
    setError('');
    setProgress(0);
    setProgressText('');
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views) => {
    if (!views) return 'Unknown';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <div className="font-sans min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* API Status Banner */}
          <div className={`mb-4 p-3 rounded-lg text-center text-sm font-medium ${
            apiStatus === 'online' 
              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
              : apiStatus === 'offline'
              ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
              : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
          }`}>
            API Status: {apiStatus === 'online' ? '✓ Online' : apiStatus === 'offline' ? '✗ Offline' : '⏳ Checking...'}
            {apiStatus === 'offline' && (
              <button 
                onClick={checkApiHealth}
                className="ml-2 underline hover:no-underline"
              >
                Retry
              </button>
            )}
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
              YouTube to MP3 Converter
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Convert YouTube videos to MP3 files with customizable bitrate
            </p>
          </div>

          {/* Step 1: URL Input */}
          {step === 'input' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <form onSubmit={handleGetVideoInfo} className="space-y-6">
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    YouTube URL
                  </label>
                  <input
                    type="url"
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !url || apiStatus !== 'online'}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Getting Video Info...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414-1.414L9 5.586 7.707 4.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L9 5.586z" clipRule="evenodd" />
                      </svg>
                      Convert
                    </>
                  )}
                </button>
              </form>

              {error && (
                <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg">
                  <div className="flex">
                    <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Video Info & Download Options */}
          {step === 'info' && videoInfo && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <button
                onClick={handleBack}
                className="mb-4 flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to URL Input
              </button>

              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-shrink-0">
                  <img
                    src={videoInfo.thumbnail}
                    alt={videoInfo.title}
                    className="w-full md:w-48 h-32 object-cover rounded-lg"
                  />
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                    {videoInfo.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    by {videoInfo.uploader}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>Duration: {formatDuration(videoInfo.duration)}</span>
                    <span>Views: {formatViews(videoInfo.view_count)}</span>
                    {videoInfo.upload_date && (
                      <span>Uploaded: {new Date(videoInfo.upload_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="bitrate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Audio Quality (Bitrate)
                </label>
                <select
                  id="bitrate"
                  value={bitrate}
                  onChange={(e) => setBitrate(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  {bitrateOptions.map((rate) => (
                    <option key={rate} value={rate}>
                      {rate} kbps {rate === 128 ? '(Recommended)' : rate >= 192 ? '(High Quality)' : '(Lower Size)'}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleDownload}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download MP3
              </button>

              {error && (
                <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg">
                  <div className="flex">
                    <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Download Progress */}
          {step === 'downloading' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <div className="text-center">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-blue-600 dark:text-blue-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  Converting Video
                </h3>
                
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {progressText}
                </p>

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-4">
                  <div 
                    className="bg-blue-600 h-4 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                    style={{ width: `${progress}%` }}
                  >
                    <span className="text-xs text-white font-medium">
                      {Math.round(progress)}%
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Please wait while we process your video...
                </p>
              </div>
            </div>
          )}

          {/* Info Section */}
          {step === 'input' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">How to use:</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Paste a YouTube video URL into the input field</li>
                <li>Click "Convert" to preview the video details</li>
                <li>Select your preferred audio quality (bitrate)</li>
                <li>Click "Download MP3" to start the conversion</li>
                <li>Watch the progress and wait for automatic download</li>
              </ol>
              
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <div className="flex">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Note:</strong> Please respect copyright laws and only download content you have permission to use.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
