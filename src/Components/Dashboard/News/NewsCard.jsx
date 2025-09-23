import React from 'react'

const NewsCard = ({ title, thumbnail, description, link }) => {
  return (
    <div className="w-90 bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Thumbnail */}
      <img
        className="w-full h-48 object-cover"
        src={thumbnail || "https://via.placeholder.com/300x200?text=No+Image"}
        alt={title || "News image"}
      />

      {/* Content */}
      <div className="p-4 flex flex-col gap-2">
        <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
          {title || "Untitled"}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-3">
          {description || "No description available."}
        </p>

        {/* Link */}
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm mt-2"
          >
            Read more →
          </a>
        )}
      </div>
    </div>
  )
}

export default NewsCard
