import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';

export default function ProgressTracker({ taskId, onComplete, onError }) {
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!taskId) return;

    const pollProgress = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.progress(taskId));
        if (response.ok) {
          const progressData = await response.json();
          setProgress(progressData);

          if (progressData.status === 'completed') {
            onComplete(taskId);
          } else if (progressData.status === 'error') {
            setError(progressData.error || 'Download failed');
            onError(progressData.error || 'Download failed');
          }
        } else {
          setError('Failed to get progress');
          onError('Failed to get progress');
        }
      } catch (err) {
        setError('Network error while checking progress');
        onError('Network error while checking progress');
      }
    };

    // Poll every 2 seconds
    const interval = setInterval(pollProgress, 2000);
    
    // Initial poll
    pollProgress();

    return () => clearInterval(interval);
  }, [taskId, onComplete, onError]);

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="bg-blue-100 dark:bg-blue-900 border border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Initializing download...
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'starting':
        return 'bg-yellow-100 dark:bg-yellow-900 border-yellow-400 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300';
      case 'downloading':
        return 'bg-blue-100 dark:bg-blue-900 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300';
      case 'processing':
        return 'bg-purple-100 dark:bg-purple-900 border-purple-400 dark:border-purple-600 text-purple-700 dark:text-purple-300';
      case 'completed':
        return 'bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-600 text-green-700 dark:text-green-300';
      case 'error':
        return 'bg-red-100 dark:bg-red-900 border-red-400 dark:border-red-600 text-red-700 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900 border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'starting':
        return (
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'downloading':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'processing':
        return (
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'completed':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'starting':
        return 'Starting download...';
      case 'downloading':
        return 'Downloading video...';
      case 'processing':
        return 'Converting to MP3...';
      case 'completed':
        return 'Download completed!';
      case 'error':
        return 'Download failed';
      default:
        return status;
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor(progress.status)}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          {getStatusIcon(progress.status)}
          <span className="ml-2 font-medium">{getStatusText(progress.status)}</span>
        </div>
        <span className="text-sm font-mono">{progress.percent}</span>
      </div>

      {/* Progress Bar */}
      {progress.status === 'downloading' && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: progress.percent }}
          ></div>
        </div>
      )}

      {/* Video Info */}
      {progress.video_info && (
        <div className="text-sm">
          <p className="font-medium">{progress.video_info.title}</p>
          {progress.video_info.duration && (
            <p>Duration: {Math.floor(progress.video_info.duration / 60)}:{(progress.video_info.duration % 60).toString().padStart(2, '0')}</p>
          )}
          <p>Quality: {progress.video_info.bitrate} kbps</p>
        </div>
      )}

      {/* Download Stats */}
      {progress.status === 'downloading' && (
        <div className="flex justify-between text-sm mt-2">
          <span>Speed: {progress.speed}</span>
          <span>ETA: {progress.eta}</span>
        </div>
      )}

      {/* Download Button for Completed */}
      {progress.status === 'completed' && (
        <button
          onClick={() => {
            const downloadUrl = API_ENDPOINTS.download(taskId);
            window.open(downloadUrl, '_blank');
          }}
          className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Download MP3
        </button>
      )}
    </div>
  );
}
