export default function VideoInfo({ videoInfo, onClose }) {
  if (!videoInfo) return null;

  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (count) => {
    if (!count) return 'Unknown';
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`;
    }
    return `${count} views`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Video Information</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Video Thumbnail */}
        <div className="space-y-4">
          {videoInfo.thumbnail && (
            <img
              src={videoInfo.thumbnail}
              alt={videoInfo.title}
              className="w-full rounded-lg shadow-sm"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
        </div>

        {/* Video Details */}
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Title</h3>
            <p className="text-gray-600 dark:text-gray-300">{videoInfo.title}</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Channel</h3>
            <p className="text-gray-600 dark:text-gray-300">{videoInfo.uploader || 'Unknown'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Duration</h3>
              <p className="text-gray-600 dark:text-gray-300">{formatDuration(videoInfo.duration)}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Views</h3>
              <p className="text-gray-600 dark:text-gray-300">{formatViews(videoInfo.view_count)}</p>
            </div>
          </div>

          {videoInfo.upload_date && (
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Upload Date</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {new Date(
                  videoInfo.upload_date.slice(0, 4),
                  videoInfo.upload_date.slice(4, 6) - 1,
                  videoInfo.upload_date.slice(6, 8)
                ).toLocaleDateString()}
              </p>
            </div>
          )}

          {videoInfo.is_live && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-red-800 dark:text-red-200 font-medium">Live Stream</span>
              </div>
            </div>
          )}

          {videoInfo.duration_warning && (
            <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                  {videoInfo.duration_warning}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {videoInfo.description && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Description</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            {videoInfo.description}
          </p>
        </div>
      )}
    </div>
  );
}
