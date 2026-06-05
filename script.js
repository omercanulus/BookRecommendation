let currentBooks = [];

function startApp() {
  const name = document.getElementById("userName").value.trim();
  if (name === "") {
    showNotification("Please enter your name :)", "error");
    return;
  }

  const checkboxes = document.querySelectorAll(".genre-cb:checked");
  if (checkboxes.length === 0) {
    showNotification("Please select at least one genre!", "error");
    return;
  }

  const selectedGenres = Array.from(checkboxes).map(cb => cb.value);

  document.getElementById("navName").innerHTML = `<i class="fas fa-user"></i> ${name}`;
  document.getElementById("navGenres").innerHTML = `<i class="fas fa-bookmark"></i> ${selectedGenres.join(", ")}`;

  document.getElementById("welcomeScreen").classList.add("hidden");
  document.getElementById("mainApp").classList.remove("hidden");

  fetchBooks(selectedGenres);
}

function showNotification(message, type) {
  const notificationBox = document.getElementById("notification");
  notificationBox.textContent = message;
  notificationBox.className = `notification-box ${type}`;
  notificationBox.classList.remove("hidden");
  setTimeout(() => {
    notificationBox.classList.add("hidden");
  }, 4000);
}

function fetchBooks(genres) {
  const bookDiv = document.getElementById("bookRecommendations");
  const loadingSpinner = document.getElementById("loadingSpinner");
  const API_KEY = CONFIG.API_KEY;

  bookDiv.innerHTML = "";
  loadingSpinner.classList.remove("hidden");
  showNotification("", "");

  const query = genres.map(g => `subject:${g}`).join("+OR+");

  fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=40&key=${API_KEY}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      loadingSpinner.classList.add("hidden");

      if (!data.items || data.items.length === 0) {
        bookDiv.innerHTML = "<p class='no-books-message'>No books found in the selected genres.</p>";
        return;
      }

      currentBooks = data.items;

      data.items.forEach((book, index) => {
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
      loadingSpinner.classList.add("hidden");
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

document.getElementById("userName").addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    startApp();
  }
});