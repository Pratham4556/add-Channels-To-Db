


const url = "https://www.youtube.com/@SonyMusicIndia";
const url1="https://www.youtube.com/c/tseries";
const url2="https://www.youtube.com/u/tseries";

const usernameExtractor = (url) => {
  const match = url.match(/(?:https:\/\/www\.youtube\.com\/(?:@|c\/|u\/|channel\/|user\/))([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null; 
};

console.log(usernameExtractor(url)); 
console.log(usernameExtractor(url1));
console.log(usernameExtractor(url2));  
