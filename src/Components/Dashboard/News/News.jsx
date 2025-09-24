import React, { useEffect, useState } from 'react'
import NewsCard from './NewsCard'

const News = () => {
  const [recentNews, setRecentNews] = useState([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(
          'https://api.rss2json.com/v1/api.json?rss_url=https://www.freecodecamp.org/news/rss/'
        );
        const data = await res.json();
        console.log("API Response:", data);

        const processedNews = data.items.map(news => ({
          title: news.title,
          description: news.description,
          link: news.link,
          thumbnail: news.thumbnail || news.enclosure?.link
        }));

        setRecentNews(processedNews);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchNews();
  }, []);

  return (
    <div className='grid grid-cols-2 lg:grid-cols-3 gap-3 my-5 p-5'>
      {recentNews.map((news, index) => (
        <NewsCard
          key={index}
          title={news.title}
          thumbnail={news.thumbnail}
          description={news.description}
          link={news.link}
        />
      ))}
    </div>
  )
}

export default News
