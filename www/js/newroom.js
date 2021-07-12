let txt;

axios
  .get("/makemeetword")
  .then((data) => {
    txt = data.data;
  })
  .catch((err) => {
    console.log("Internal Server Error: ", err);
    window.location.href = "/dashboard";
  });

function setLink() {
  window.location.href = "/join/" + txt;
}
