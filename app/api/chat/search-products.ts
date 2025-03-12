export async function searchProducts(query: string, limit: number = 10) {
  try {
    console.log(`Searching products with keyword: "${query}", limit: ${limit}`);
    const url = `https://pink.beautysecrets.mn/api/product/search?keyword=${encodeURIComponent(
      query
    )}&per_page=${limit}&page=1`;

    console.log(`API request URL: ${url}`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(
      `API returned ${data.data?.length || 0} products for search: ${query}`
    );
    return data;
  } catch (error) {
    console.error("Error searching products:", error);
    return { error: "Failed to search products", details: error };
  }
}
