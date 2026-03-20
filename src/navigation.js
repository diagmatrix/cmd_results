/**
 * Renders the top navigation bar for the application.
 * @returns {void}
 */
export function renderNavBar() {
  if (document.getElementById('mainTopNav')) {
    return;
  }

  document.body.insertAdjacentHTML('afterbegin', `
    <nav id="mainTopNav" class="bg-gray-800 border-b border-gray-700 mb-6 w-full">
  <div class="flex items-center justify-start h-16 w-full">
    <div class="flex space-x-6">
      <a href="index.html" class="text-gray-100 font-bold text-lg sm:text-xl hover:text-blue-400 px-4 py-2 rounded transition">Home</a>
      <a href="games-table.html" class="text-gray-100 font-bold text-lg sm:text-xl hover:text-blue-400 px-4 py-2 rounded transition">Games Table</a>
    </div>
  </div>
</nav>
  `);
}
