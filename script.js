let currentBooks = [];
let notificationTimeout;

function startApp(event) {
  if (event) {
    event.preventDefault();
  }

  const nameElement = document.getElementById("userName");
  const name = nameElement ? nameElement.value.trim() : "Guest";

  const finalName = name === "" ? "Guest" : name;

  const checkboxes = document.querySelectorAll(".genre-cb:checked");
  let selectedGenres = [];
  let navGenreText = "";

  if (checkboxes.length === 0) {
    selectedGenres = ["fiction"];
    navGenreText = "Mixed Books";
  } else {
    selectedGenres = Array.from(checkboxes).map(cb => cb.value);
    navGenreText = selectedGenres.join(", ");
  }

  const navNameEl = document.getElementById("navName");
  const navGenresEl = document.getElementById("navGenres");

  if (navNameEl) navNameEl.innerHTML = `<i class="fas fa-user"></i> ${finalName}`;
  if (navGenresEl) navGenresEl.innerHTML = `<i class="fas fa-bookmark"></i> ${navGenreText}`;

  const welcomeScreen = document.getElementById("welcomeScreen");
  const mainApp = document.getElementById("mainApp");

  if (welcomeScreen) welcomeScreen.classList.add("hidden");
  if (mainApp) mainApp.classList.remove("hidden");

  fetchBooks(selectedGenres);
}

function showNotification(message, type) {
  const notificationBox = document.getElementById("notification");

  if (!notificationBox) {
    if (message) alert(message);
    return;
  }

  if (!message) {
    notificationBox.classList.add("hidden");
    return;
  }

  notificationBox.textContent = message;
  notificationBox.className = `notification-box ${type}`;
  notificationBox.classList.remove("hidden");

  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
  }

  notificationTimeout = setTimeout(() => {
    notificationBox.classList.add("hidden");
  }, 4000);
}

function fetchBooks(genres) {
  const bookDiv = document.getElementById("bookRecommendations");
  const loadingSpinner = document.getElementById("loadingSpinner");

  const API_KEY = typeof process !== 'undefined' ? process.env.API_KEY : CONFIG.API_KEY

  bookDiv.innerHTML = "";
  if (loadingSpinner) loadingSpinner.classList.remove("hidden");

  showNotification("", "");

  const fetchPromises = genres.map(g =>
    fetch(`https://www.googleapis.com/books/v1/volumes?q=subject:"${g}"&maxResults=15&key=${API_KEY}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
  );

  Promise.all(fetchPromises)
    .then(results => {
      if (loadingSpinner) loadingSpinner.classList.add("hidden");

      currentBooks = [];

      results.forEach(data => {
        if (data.items) {
          currentBooks.push(...data.items);
        }
      });

      if (currentBooks.length === 0) {
        bookDiv.innerHTML = "<p class='no-books-message'>No books found in the selected genres. Please try another one.</p>";
        return;
      }

      currentBooks.forEach((book, index) => {
        const volumeInfo = book.volumeInfo;
        const title = volumeInfo.title || "Title Not Available";
        const author = volumeInfo.authors ? volumeInfo.authors.join(", ") : "Unknown Author";
        let shortDesc = volumeInfo.description || "No description available.";
        if (shortDesc.length > 90) {
          shortDesc = shortDesc.substring(0, 90) + "...";
        }
        const imageUrl = volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192.png?text=Book';

        bookDiv.innerHTML += `
          <div class="book-card">
            <img src="${imageUrl}" alt="${title} Cover" class="book-cover">
            <h3>${title}</h3>
            <p><strong>Author:</strong> ${author}</p>
            <p>${shortDesc}</p>
            <button class="details-btn" onclick="openModal(${index})">Show Details</button>
          </div>
        `;
      });
    })
    .catch(error => {
      if (loadingSpinner) loadingSpinner.classList.add("hidden");
      console.error("API Error:", error);
      showNotification("An error occurred while fetching books.", "error");
      bookDiv.innerHTML = "<p class='error-message'>An error occurred while retrieving data.</p>";
    });
}

function openModal(index) {
  const bookInfo = currentBooks[index].volumeInfo;

  document.getElementById('modalTitle').textContent = bookInfo.title || "Unknown Title";
  document.getElementById('modalAuthor').textContent = bookInfo.authors ? bookInfo.authors.join(", ") : "Unknown Author";
  document.getElementById('modalDate').textContent = bookInfo.publishedDate ? `Published: ${bookInfo.publishedDate}` : "";
  document.getElementById('modalDesc').textContent = bookInfo.description || "No detailed description available.";
  document.getElementById('modalImg').src = bookInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192.png?text=Book';

  const linkBtn = document.getElementById('modalLink');
  if (bookInfo.previewLink) {
    linkBtn.href = bookInfo.previewLink;
    linkBtn.style.display = "inline-block";
  } else {
    linkBtn.style.display = "none";
  }

  document.getElementById('bookModal').classList.remove('hidden');
  setTimeout(() => document.getElementById('bookModal').classList.add('show'), 10);
}

function closeModal() {
  const modal = document.getElementById('bookModal');
  modal.classList.remove('show');
  setTimeout(() => modal.classList.add('hidden'), 300);
}

window.onclick = function (event) {
  const modal = document.getElementById('bookModal');
  if (event.target === modal) {
    closeModal();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const userNameInput = document.getElementById("userName");
  if (userNameInput) {
    userNameInput.addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        startApp(event);
      }
    });
  }
});