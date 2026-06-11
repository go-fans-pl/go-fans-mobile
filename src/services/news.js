import axios from 'axios';

const WP_BASE_URL = 'https://jksjaroslaw.com/wp-json/wp/v2';

const wp = axios.create({
  baseURL: WP_BASE_URL,
  timeout: 8000,
});

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

export const newsService = {
  getLatestPosts: async (limit = 3) => {
    const response = await wp.get('/posts', {
      params: { per_page: limit, _fields: 'id,date,title,excerpt,link' },
    });
    return (response.data || []).map(post => ({
      id: post.id,
      date: post.date,
      title: stripHtml(post.title?.rendered),
      excerpt: stripHtml(post.excerpt?.rendered),
      link: post.link,
    }));
  },
};
