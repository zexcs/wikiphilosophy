const axios = require("axios");
const cheerio = require("cheerio");

const startingSlug = "/wiki/Special:Random";
const goal = "/wiki/Philosophy";

// Returns true if an element is in parentheses otherwise returns false
const myFilter = (element) => {
  const array = element.parent.children.map((e) => e.data);
  const { children } = element.parent;
  for (let i = 0; i < array.length; i++) {
    if (array[i] === undefined) {
      const { name } = element.parent;
      if (name === "i" || name === "small") return true;
      if (children[i] === element) return false;
      continue;
    }
    if (array[i].includes("(")) {
      for (let j = i; j < array.length; j++) {
        if (array[j] === undefined) {
          if (children[j] === element) return true;
          continue;
        }
        if (array[j].includes("(") && children[j + 1] === element) return true;
        if (array[j].includes(")")) {
          break;
        }
      }
    }
  }
  return false;
};

(async () => {
  let i = 1;
  let slug = startingSlug;
  let slugs = [];
  while (true) {
    try {
      const res = await axios({
        method: "get",
        url: `https://en.wikipedia.org${slug}`,
      });
      const $ = cheerio.load(res.data);
      $("table").remove();
      const data = $(".mw-parser-output")
        .find("p a")
        .toArray()
        .map((element) => {
          if (myFilter(element)) return "wiktionary";
          return $(element).attr("href");
        })
        .filter(
          (el) =>
            el &&
            el.includes("/wiki/") &&
            !el.includes("Help") &&
            !el.includes("File") &&
            !el.includes("wiktionary")
        );

      if (data.length < 1) {
        throw new Error("No links!");
      }

      let j = 0;
      do {
        slug = data[j++];
      } while (slugs.find((s) => s === slug));

      slugs.push(slug);
      console.log(`https://en.wikipedia.org${slug}`);

      if (slug === goal) {
        console.log("Done:", i, "steps");
        return;
      }
      i++;
    } catch (err) {
      throw new Error("Something went wrong, try again!");
    }
  }
})();
