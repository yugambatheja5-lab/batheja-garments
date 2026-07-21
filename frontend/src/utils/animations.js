export const triggerCartAnimation = (event, imageUrl) => {
  if (!event || !event.currentTarget) return;
  
  const cartIcon = document.getElementById("nav-cart-icon");
  if (!cartIcon) return;

  const btnRect = event.currentTarget.getBoundingClientRect();
  const cartRect = cartIcon.getBoundingClientRect();

  const movingImg = document.createElement("img");
  movingImg.src = imageUrl;
  movingImg.style.position = "fixed";
  movingImg.style.top = `${btnRect.top}px`;
  movingImg.style.left = `${btnRect.left}px`;
  movingImg.style.width = "60px";
  movingImg.style.height = "60px";
  movingImg.style.objectFit = "cover";
  movingImg.style.borderRadius = "50%";
  movingImg.style.zIndex = "9999";
  movingImg.style.boxShadow = "0 10px 40px rgba(0,0,0,0.2)";
  movingImg.style.transition = "all 0.8s cubic-bezier(0.25, 0.46, 0.2, 0.98)";
  
  document.body.appendChild(movingImg);

  requestAnimationFrame(() => {
    movingImg.style.top = `${cartRect.top + 10}px`;
    movingImg.style.left = `${cartRect.left + 10}px`;
    movingImg.style.transform = "scale(0.1)";
    movingImg.style.opacity = "0";
  });

  setTimeout(() => {
    if (movingImg.parentNode) movingImg.parentNode.removeChild(movingImg);
    
    // Icon Pop Feedback
    cartIcon.style.transition = "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    cartIcon.style.transform = "scale(1.4)";
    cartIcon.style.color = "var(--champagne)";

    setTimeout(() => {
      cartIcon.style.transform = "scale(1)";
      cartIcon.style.color = "inherit";
    }, 250);
  }, 800);
};

export const triggerFavoriteAnimation = (event) => {
  if (!event || !event.currentTarget) return;
  
  const favIcon = document.getElementById("nav-fav-icon");
  if (!favIcon) return;

  const btnRect = event.currentTarget.getBoundingClientRect();
  const favRect = favIcon.getBoundingClientRect();

  const heart = document.createElement("span");
  heart.innerHTML = "❤️";
  heart.style.position = "fixed";
  heart.style.top = `${btnRect.top}px`;
  heart.style.left = `${btnRect.left}px`;
  heart.style.fontSize = "24px";
  heart.style.zIndex = "9999";
  heart.style.transition = "all 0.8s cubic-bezier(0.25, 0.46, 0.2, 0.98)";
  
  document.body.appendChild(heart);

  requestAnimationFrame(() => {
    heart.style.top = `${favRect.top + 5}px`;
    heart.style.left = `${favRect.left + 5}px`;
    heart.style.transform = "scale(0.2) rotate(45deg)";
    heart.style.opacity = "0";
  });

  setTimeout(() => {
    if (heart.parentNode) heart.parentNode.removeChild(heart);
    
    // Icon Pop Feedback
    favIcon.style.transition = "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    favIcon.style.transform = "scale(1.4)";
    favIcon.style.color = "#ff4d4d";

    setTimeout(() => {
      favIcon.style.transform = "scale(1)";
      favIcon.style.color = "inherit";
    }, 250);
  }, 800);
};
