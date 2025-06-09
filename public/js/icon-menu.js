// icon menu

const userIcon = document.getElementById("userIcon");
if (userIcon) {
  userIcon.addEventListener("click", function () {
    var menu = document.getElementById("userConfig");
    if (menu.style.display === "block") {
      menu.style.display = "none";
    } else {
      menu.style.display = "block";
    }
  });
}

document.addEventListener("click", function (event) {
  var menu = document.getElementById("userConfig");
  var icon = document.getElementById("userIcon");
  if (
    menu &&
    icon &&
    event.target !== icon &&
    !icon.contains(event.target) &&
    event.target !== menu &&
    !menu.contains(event.target)
  ) {
    menu.style.display = "none";
  }
});

// menu hamburguer

const menuHamburguer = document.getElementById("menuHamburguer");
const closeMenu = document.getElementById("closeMenu");
const userMenu = document.getElementById("userMenu");
const menuOverlay = document.querySelector(".menu-overlay");

if (menuHamburguer && userMenu) {
  menuHamburguer.addEventListener("click", function (e) {
    e.stopPropagation();
    userMenu.classList.toggle("show");
    menuOverlay.classList.toggle("show");
  });
}

if (closeMenu && userMenu) {
  closeMenu.addEventListener("click", function (e) {
    e.stopPropagation();
    userMenu.classList.remove("show");
    menuOverlay.classList.remove("show");
  });
}

// Fechar menu ao clicar no overlay
if (menuOverlay) {
  menuOverlay.addEventListener("click", function (e) {
    e.stopPropagation();
    userMenu.classList.remove("show");
    menuOverlay.classList.remove("show");
  });
}

// Fechar menu ao clicar fora do menu
document.addEventListener("click", function (event) {
  if (userMenu && userMenu.classList.contains("show")) {
    const isClickInsideMenu = userMenu.contains(event.target);
    const isClickOnHamburger = menuHamburguer && menuHamburguer.contains(event.target);
    const isClickOnClose = closeMenu && closeMenu.contains(event.target);
    const isClickOnOverlay = menuOverlay && menuOverlay.contains(event.target);

    if (!isClickInsideMenu && !isClickOnHamburger && !isClickOnClose && !isClickOnOverlay) {
      userMenu.classList.remove("show");
      menuOverlay.classList.remove("show");
    }
  }
});

document.addEventListener("click", function (event) {
  var menu = document.getElementById("userMenu");
  var icon = document.getElementById("menuHamburguer");
  var close = document.getElementById("closeMenu");
  if (
    menu &&
    icon &&
    event.target !== icon &&
    !icon.contains(event.target) &&
    event.target !== menu &&
    !menu.contains(event.target)
  ) {
    menu.classList.remove("show");
  }
});