// blog-search.ts
import axios from "axios";

interface Blog {
  id: string;
  title: string;
  content?: string;
  description?: string;
}

export async function fetchBlogs(page = 17): Promise<Blog[]> {
  try {
    const response = await axios.get(
      `https://pink.beautysecrets.mn/api/blog/list?page=${page}`
    );
    return response.data.blogs || [];
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return [];
  }
}

async function fetchBlogContent(blogId: string): Promise<Blog | null> {
  try {
    const response = await axios.get(
      `https://pink.beautysecrets.mn/api/blog/${blogId}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching blog content for ID ${blogId}:`, error);
    return null;
  }
}

export async function searchBlogs(
  query: string,
  limit = 3
): Promise<{
  relevantBlogs: Blog[];
  query: string;
}> {
  const keywords = query.toLowerCase().split(" ");
  let allBlogs: Blog[] = [];

  for (let page = 1; page <= 3; page++) {
    const blogs = await fetchBlogs(page);
    if (blogs.length === 0) break;
    allBlogs = [...allBlogs, ...blogs];
  }

  const relevantBlogs = allBlogs.filter((blog) => {
    const title = blog.title.toLowerCase();
    return keywords.some(
      (keyword) => keyword.length > 3 && title.includes(keyword)
    );
  });

  const blogsWithContent = await Promise.all(
    relevantBlogs.slice(0, limit).map(async (blog) => {
      const fullBlog = await fetchBlogContent(blog.id);
      return fullBlog || blog;
    })
  );

  return {
    relevantBlogs: blogsWithContent.filter(Boolean) as Blog[],
    query,
  };
}
