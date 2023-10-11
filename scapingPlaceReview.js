const puppeteer = require("puppeteer");
const fs = require("fs");
const XLSX = require("xlsx");
let places = [];

const typeSort = {
  NEWEST: 'Newest',
  MOST_RELAVANET: "Most relevant",
  HIGHEST_RATING: "Highest rating",
  LOWEST_RATING: "Lowest rating"
}
async function autoScroll(page, maxScrolls) {
  try {
    const result = await page.evaluate(async (maxScrolls) => {
      return new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 300;
        let scrolls = 0; // scrolls counter
        const timer = setInterval(() => {
          let element = document.querySelectorAll(".m6QErb");
          console.log("element", element);
          if (!element) {
            // Check if the element is found, and if not, clear the interval and resolve
            clearInterval(timer);
            resolve();
          } else {
            const scrollHeight = element.scrollHeight;
            console.log("scrollHeight", scrollHeight);
            for (var o = 0; o < element.length; o++)
              element[o].scrollBy(0, distance);
            totalHeight += distance;
            scrolls++; // increment counter
            console.log("h,s", totalHeight);
            console.log(scrolls);

            // Stop scrolling if reached the end or the maximum number of scrolls
            if (
              totalHeight >= scrollHeight - window.innerHeight ||
              scrolls >= maxScrolls
            ) {
              clearInterval(timer);

              console.log(
                document.querySelectorAll(".m6QErb")[element.length - 1]
              );
              resolve(document.querySelectorAll(".m6QErb")[element.length - 1]);
            }
          }
        }, 100);
      });
    }, maxScrolls); // pass maxScrolls to the function

    // console.log("result1", result);
    const pageContent = await page.content();
    // console.log("pageContent,", pageContent);

    return pageContent;
  } catch (error) {
    console.error("Error in autoScroll:", error);
    return null; // Handle errors gracefully
  }
}

async function parsePlace(page) {
  //   let places = [];
  const elements = await page.$$("div.jftiEf.fontBodyMedium");
  // const e = await page.$$(".fontBodyMedium");

  console.log("elements", elements);
  console.log(elements.length);

  if (elements && elements.length) {
    for (const el of elements) {
      // const ell = await el.asElement();
      // console.log(ell)
      const result = await el.evaluate((div) => {
        // Use getAttribute to get the aria-label property
        const name = div.getAttribute("aria-label");
        console.log('divvvvvvvv')
        console.log(div)
        const reviewElement = div.querySelector(".MyEned span");
        const review = reviewElement ? reviewElement.innerText : "";
        const review_id = div.getAttribute("data-review-id");
        let rating = div
          .querySelector(".DU9Pgb span")
          .getAttribute("aria-label");
        rating = rating && rating.split(" ")[0];
        const durationElement =div.querySelector(".DU9Pgb .rsqaWe");
        const duration =durationElement ? durationElement.innerText : "";
        const likeElement =  div.querySelector(".GBkF3d")
        let like_count = likeElement && likeElement.innerText;
        like_count = like_count == "Like" || !like_count ? 0 : like_count;
        const data = {
          name,
          review,
          rating,
          duration,
          like_count,
          review_id,
          sort_type :'Lowest rating',
        };
        return data;
      });

      places.push(result);
    }
  }
  return places;
}

async function sortData(page, sort_type) {
  // Click the "Sort reviews" button
  await page.waitForSelector('button.g88MCb.S9kvJb[aria-label="Sort reviews"]');
  await page.click('button.g88MCb.S9kvJb[aria-label="Sort reviews"]');

  // Click the "Newest" option
  // const timeout = 1000; // Set a timeout (e.g., 10 seconds)
  await page.waitForFunction(
    async () => {
      const optionElements = document.querySelectorAll(".mLuXec");
      for (let i = 0; i < optionElements.length; i++) {
        if (optionElements[i].textContent.trim() === 'Lowest rating') {
          optionElements[i].click();
          // await parsePlace(page);
          return true;
        }
      }
      return false;
    },
    // { timeout }
  );
}

(async () => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({
    headless: false,
    // defaultViewport: null,
    // args: ['--start-maximized'],
    // timeout: 60000000,
    protocolTimeout: 24000000,
  });
  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto(
    "https://www.google.com/maps/place/Jolly+Grant+Airport+-+Dehradun/@30.1951339,78.1920972,17z/data=!4m8!3m7!1s0x390925cb4f7f8be5:0x7018c089cc1f61f7!8m2!3d30.1951339!4d78.1920972!9m1!1b1!16zL20vMGdza3hz?entry=ttu"
  );

  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 });

  //--------------Fetching Newest, Highest rating, Most relavant data ----------------
  // var button = document.querySelector('button.g88MCb.S9kvJb[aria-label="Sort reviews"]');
  // button.click();
  // var optionElements = document.querySelectorAll('.mLuXec');
  // for (var i = 0; i < optionElements.length; i++) {
  //   if (optionElements[i].textContent.trim() === "Newest") {
  //     optionElements[i].click();
  //     break; // Exit the loop once the option is clicked
  //   }
  // }
  await sortData(page)

  //--------------Scrolling ---------------------
  await autoScroll(page, 2500);

  //------------------Parse element
  await parsePlace(page);
  // console.log(places);
  console.log(places.length);

  //----------------------Create a worksheet---------------------
  const ws = XLSX.utils.json_to_sheet(places);
  // Create a workbook and add the worksheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reviews');
  // Write the workbook to a file
  XLSX.writeFile(wb, 'google_map_review_lowest_rating.xlsx', { bookSST: true });
  console.log('Excel file "reviews.xlsx" has been created.');
})();
