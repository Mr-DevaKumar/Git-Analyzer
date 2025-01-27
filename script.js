const API_BASE_URL = "https://api.github.com";
const repoForm = document.getElementById("repoForm");
const outputDiv = document.getElementById("output");
const activityChart = document.getElementById("activityChart");

repoForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const repoUrl = document.getElementById("repoUrl").value;
    const match = repoUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)(\/.*)?$/);

    if (!match) {
        outputDiv.innerHTML = `<p style="color: red;">Invalid GitHub repository URL. Please try again.</p>`;
        return;
    }

    const [_, owner, repo] = match;

    try {
        const [repoData, contributors, issues, commits] = await Promise.all([
            fetch(`${API_BASE_URL}/repos/${owner}/${repo}`).then((res) => res.json()),
            fetch(`${API_BASE_URL}/repos/${owner}/${repo}/contributors`).then((res) => res.json()),
            fetch(`${API_BASE_URL}/repos/${owner}/${repo}/issues?state=all`).then((res) => res.json()),
            fetch(`${API_BASE_URL}/repos/${owner}/${repo}/commits`).then((res) => res.json()),
        ]);

        displayRepoDetails(repoData, contributors, issues, commits);
        plotActivityChart(commits);

    } catch (error) {
        outputDiv.innerHTML = `<p style="color: red;">Error fetching data. Please check the repository details.</p>`;
    }
});

function displayRepoDetails(repoData, contributors, issues, commits) {
    const openIssues = issues.filter((issue) => issue.state === "open").length;
    const closedIssues = issues.filter((issue) => issue.state === "closed").length;

    outputDiv.innerHTML = `
        <h2>Repository: ${repoData.full_name}</h2>
        <p>${repoData.description || "No description provided."}</p>
        <ul>
            <li>🌟 Stars: ${repoData.stargazers_count}</li>
            <li>🍴 Forks: ${repoData.forks_count}</li>
            <li>👨‍💻 Top Contributors:
                <ul>
                    ${contributors.slice(0, 5).map((c) => `<li>${c.login}: ${c.contributions} contributions</li>`).join("")}
                </ul>
            </li>
            <li>✅ Open Issues: ${openIssues}</li>
            <li>❌ Closed Issues: ${closedIssues}</li>
        </ul>
    `;
}

function plotActivityChart(commits) {
    const commitDates = commits.map((commit) =>
        new Date(commit.commit.author.date).toISOString().split("T")[0]
    );

    const commitCounts = commitDates.reduce((acc, date) => {
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});

    const labels = Object.keys(commitCounts);
    const data = Object.values(commitCounts);

    new Chart(activityChart, {
        type: "bar",
        data: {
            labels,
            datasets: [
                {
                    label: "Commits",
                    data,
                    backgroundColor: "rgba(0, 123, 255, 0.6)",
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
            },
            scales: {
                x: { title: { display: true, text: "Date" } },
                y: { title: { display: true, text: "Number of Commits" } },
            },
        },
    });
}
