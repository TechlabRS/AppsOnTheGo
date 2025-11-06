// Function to create a Chart.js instance (This is where the charts are drawn)
function createChart(canvasId, dates, prices) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const isRising = prices[prices.length - 1] > prices[0];
    const chartColor = isRising ? 'rgba(40, 167, 69, 1)' : 'rgba(220, 53, 69, 1)'; // Success or Danger color

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                data: prices,
                borderColor: chartColor,
                backgroundColor: isRising ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)',
                borderWidth: 2,
                pointRadius: 3,
                tension: 0.4,
                fill: true,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                x: { display: true, title: { display: false } },
                y: { display: true, title: { display: false } }
            },
            elements: { line: { tension: 0.4 } }
        }
    });
}

async function loadAutoTrends() {
  const output = document.getElementById("autoTrends");
  output.innerHTML = "<h2>Auto Trend Analysis</h2><p>Loading Auto Trend Data...</p>";

  try {
    const res = await fetch("/api/auto_trends");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.error) {
      output.innerHTML = `<h2>Auto Trend Analysis</h2><span style='color:var(--danger-color);'>${data.error}</span>`;
      return;
    }

    // Generate HTML for all items, including the chart canvas
    const htmlContent = data
      .map((item, index) => {
        const indicatorClass = item.streak_type === "rise" ? "rise" : "fall";
        const canvasId = `trendChart-${index}`;

        return `
        <div class="stock-item">
          <div class="stock-symbol">${item.symbol}</div>
          <div class="trend-indicator ${indicatorClass}">
            ${item.streak_type.toUpperCase()} Streak (${item.days} days)
          </div>
          <div class="info-date">
            Last Close: ₹${item.last_close} (${item.as_of})
          </div>
        </div>
        <div class="trend-detail-chart">
            <canvas id="${canvasId}"></canvas>
        </div>
      `;
      })
      .join("");

    output.innerHTML = `<h2>Auto Trend Analysis</h2>${htmlContent}`;

    // Create charts after the HTML elements are in the DOM
    data.forEach((item, index) => {
        createChart(`trendChart-${index}`, item.dates, item.prices);
    });

  } catch (err) {
    console.error("Error fetching auto trends:", err);
    output.innerHTML = `<h2>Auto Trend Analysis</h2><span style='color:var(--danger-color);'>Failed: ${err.message}</span>`;
  }
}

async function loadMomentum() {
  const output = document.getElementById("momentumResult");
  output.innerHTML = "<h2>All 5-Day Momentum Changes</h2><p>Loading momentum data...</p>";

  try {
    const res = await fetch("/api/momentum");
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Server error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    if (data.error) {
      output.innerHTML = `<h2>All 5-Day Momentum Changes</h2><span style='color:var(--danger-color);'>${data.error}</span>`;
      return;
    }

    data.sort((a, b) => b.change_pct - a.change_pct);

    output.innerHTML = `<h2>All 5-Day Momentum Changes</h2>` + data
      .map(
        (item) => {
            const changeClass = item.change_pct >= 0 ? "rise" : "fall";
            const sign = item.change_pct > 0 ? "+" : "";

            return `
              <div class="stock-item">
                <div class="stock-symbol">${item.symbol}</div>
                <div class="momentum-value ${changeClass}">
                  ${sign}${item.change_pct}% 
                </div>
                <div class="info-date">
                  Close: ₹${item.last_close} (${item.as_of})
                </div>
              </div>
            `;
        }
      )
      .join("");
  } catch (err) {
    console.error("Error fetching momentum data:", err);
    output.innerHTML = `<h2>All 5-Day Momentum Changes</h2><span style='color:var(--danger-color);'>Failed: ${err.message}</span>`;
  }
}

async function loadHighLow() {
  const output = document.getElementById("highLowResult");
  output.innerHTML = "<h2>🔥 5-Day High/Low Performers</h2><p>Loading high/low performance data...</p>";

  try {
    const res = await fetch("/api/high_low_performers");
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Server error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    if (data.error) {
      output.innerHTML = `<h2>5-Day High/Low Performers</h2><span style='color:var(--danger-color);'>${data.error}</span>`;
      return;
    }

    const renderList = (list) => {
        return list.map(
            (item) => {
                const changeClass = item.change_pct >= 0 ? "rise" : "fall";
                const sign = item.change_pct > 0 ? "+" : "";

                return `
                    <div class="stock-item">
                        <div class="stock-symbol">${item.symbol}</div>
                        <div class="momentum-value ${changeClass}">
                            ${sign}${item.change_pct}% 
                        </div>
                        <div class="info-date">
                            Close: ₹${item.last_close} (${item.as_of})
                        </div>
                    </div>
                `;
            }
        ).join("");
    };

    const highList = renderList(data.high);
    const lowList = renderList(data.low);
    const N = data.N || 3;

    output.innerHTML = `
        <h2>🔥 ${data.period} High/Low Performers (Top/Bottom ${N})</h2>
        
        <h3>🚀 Top High Performers</h3>
        <div style="margin-bottom: 20px; border: 1px solid var(--success-color); padding: 10px; border-radius: 4px;">
            ${highList.length ? highList : '<p style="color:var(--secondary-color);">No stocks found in this category.</p>'}
        </div>

        <h3>📉 Bottom Low Performers</h3>
        <div style="border: 1px solid var(--danger-color); padding: 10px; border-radius: 4px;">
            ${lowList.length ? lowList : '<p style="color:var(--secondary-color);">No stocks found in this category.</p>'}
        </div>
    `;

  } catch (err) {
    console.error("Error fetching high/low data:", err);
    output.innerHTML = `<h2>5-Day High/Low Performers</h2><span style='color:var(--danger-color);'>Failed: ${err.message}</span>`;
  }
}

// ----------------------------
// Load Moving Average (20-Day SMA) - NOW CORRECTLY DEFINED
// ----------------------------
async function loadMovingAverage() {
  const output = document.getElementById("movingAverageResult");
  output.innerHTML = "<h2>📈 20-Day Moving Average (SMA)</h2><p>Loading 20-Day SMA data...</p>";

  try {
    const res = await fetch("/api/moving_average");
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Server error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    if (data.error) {
      output.innerHTML = `<h2>20-Day Moving Average (SMA)</h2><span style='color:var(--danger-color);'>${data.error}</span>`;
      return;
    }

    output.innerHTML = `<h2>📈 ${data[0].sma_period}-Day Moving Average (SMA)</h2>` + data
      .map(
        (item) => {
            const statusClass = item.status === "Above SMA" ? "status-above" : "status-below";
            const deviationClass = item.deviation_pct >= 0 ? "rise" : "fall";
            const sign = item.deviation_pct > 0 ? "+" : "";

            return `
              <div class="stock-item">
                <div class="stock-symbol">${item.symbol}</div>
                <div class="${statusClass}">
                  ${item.status}
                </div>
                <div class="momentum-value ${deviationClass}">
                  ${sign}${item.deviation_pct}%
                </div>
                <div class="info-date">
                  Close: ₹${item.last_close} | SMA: ₹${item.last_sma} (${item.as_of})
                </div>
              </div>
            `;
        }
      )
      .join("");

  } catch (err) {
    console.error("Error fetching MA data:", err);
    output.innerHTML = `<h2>20-Day Moving Average (SMA)</h2><span style='color:var(--danger-color);'>Failed: ${err.message}</span>`;
  }
}
