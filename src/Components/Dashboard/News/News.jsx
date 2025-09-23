import React, { useEffect, useState } from 'react'
import NewsCard from './NewsCard';

const News = () => {
  const [recentNews, setRecentNews] = useState([]);

  useEffect(() => {
    const fetchNews = async () => {
      const res = await fetch(
        'https://api.rss2json.com/v1/api.json?rss_url=https://www.freecodecamp.org/news/rss/'
      );
      const data = await res.json();

      // Filter out incomplete items
      const filteredNews = data.items.filter(
        news => news.title && news.thumbnail && news.link && news.description
      );

      setRecentNews(filteredNews);
    }

    fetchNews();
  }, []);


  return (
    <div className='grid grid-cols-3 gap-3 my-5 p-5' >
      {recentNews.map((news, index) =>
  news.title && news.thumbnail && news.link && news.description ? (
    <NewsCard
      key={index}
      title={news.title}
      thumbnail={news.thumbnail}
      description={news.description}
      link={news.link}
    />
  ) : null
)}

    </div>
  )
}

export default News;
