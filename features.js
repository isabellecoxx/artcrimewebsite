let index = 0;

function nextImage() {
    const img = document.getElementById("imageViewer");

    // fade out
    img.style.opacity = 0;

    setTimeout(() => {
        index = (index + 1) % images.length;
        img.src = images[index];

        // small delay ensures browser registers new image
        setTimeout(() => {
            img.style.opacity = 1;
        }, 50);

    }, 400); // match CSS transition duration
}


document.querySelectorAll(".dropdown-title").forEach(title => {
    title.addEventListener("click", () => {

        const dropdown = title.parentElement;
        const content = dropdown.querySelector(".dropdown-content");
        const arrow = dropdown.querySelector(".arrow");

        // close all dropdowns first
        document.querySelectorAll(".dropdown").forEach(d => {
            d.querySelector(".dropdown-content").style.maxHeight = null;
            d.querySelector(".arrow").style.transform = "rotate(0deg)";
        });

        // if it was already open, just stop here (so it toggles off)
        if (content.style.maxHeight) {
            return;
        }

        // open clicked one
        content.style.maxHeight = content.scrollHeight + "px";
        arrow.style.transform = "rotate(180deg)";
    });
});