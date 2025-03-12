export async function beautyboxProducts() {
  try {
    const url = `https://pink.beautysecrets.mn/api/subscription/product/beautybox`;

    console.log(`API request URL: ${url}`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(
      `API returned ${data.data?.length || 0} products for beautybox`
    );

    return data.data?.product?.items;
  } catch (error) {
    console.error("Error searching products:", error);
    return { error: "Failed to search products", details: error };
  }
}
