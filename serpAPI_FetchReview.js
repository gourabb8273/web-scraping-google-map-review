const SerpApi = require("serpapi");
const fs = require("fs");
const xlsx = require("xlsx");
const axios = require("axios");

async function fetchAndSaveReviews() {
  const apiKey =
    "Add ur key";
  const placeId = "ChIJ5Yt_T8slCTkR92EfzInAGHA";
  let search;
  let allReviews = [];
  let i = 98,
    a = 0;
  // Fetch reviews from SerpApi
  let nextPageToken = null;
  do {
    const params = {
      engine: "google_maps_reviews",
      place_id: placeId,
      api_key: apiKey,
      next: nextPageToken, // Use the next_page_token if available
    };
    // console.log(nextPageToken)
    if (!nextPageToken) {
      search = await SerpApi.getJson(params);
    } else {
      // console.log(nextPageToken)
      search = await axios.get(nextPageToken + "&api_key=" + apiKey);
      // console.log(search)
      search = search.data;
      // console.log(search.data)
    }

    if (search.reviews) {
      const reviews = search.reviews;
      console.log(reviews[0].user.name);
      a = a + reviews.length;
      console.log(a);
      allReviews = allReviews.concat(reviews);
      //   console.log(allReviews)
    }

    // Check if there's a next page token
    if (search.serpapi_pagination && search.serpapi_pagination.next) {
      nextPageToken = search.serpapi_pagination.next;
    } else {
      nextPageToken = null;
    }
  } while (nextPageToken && i--);

  allReviews = allReviews.map((obj) => ({
    ...obj,
    user: obj.user.name,
  }));
//   console.log(allReviews);
  //   Save reviews to an Excel file
  if (allReviews.length > 0) {
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(allReviews);
    xlsx.utils.book_append_sheet(workbook, worksheet, "Reviews");
    xlsx.writeFile(workbook, "googleMap_reviews_data.xlsx");
    console.log(`Saved ${allReviews.length} reviews to google_reviews.xlsx`);
  } else {
    console.log("No reviews found.");
  }
}

fetchAndSaveReviews();
