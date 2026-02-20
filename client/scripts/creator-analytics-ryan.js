const slug = 'ryan';

const statusBanner = document.getElementById('statusBanner');
const kpiGrid = document.getElementById('kpiGrid');
const timeseriesBody = document.getElementById('timeseriesBody');
const notesList = document.getElementById('notesList');
const rangeDays = document.getElementById('rangeDays');
const refreshButton = document.getElementById('refreshButton');

function currencyFmt(currency = 'GBP') {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  });
}

function numberFmt(value) {
  return new Intl.NumberFormat('en-GB').format(Number(value || 0));
}

function renderKpis(summary, currency) {
  const fmt = currencyFmt(currency);
  const kpis = [
    ['Checkout visits', numberFmt(summary.checkoutVisits)],
    ['Email signups (Stripe customers)', numberFmt(summary.emailSignups)],
    ['Paid conversions', numberFmt(summary.paidConversions)],
    ['Conversion rate', `${summary.conversionRate.toFixed(1)}%`],
    ['Gross revenue', fmt.format(summary.grossRevenue || 0)],
    ['Estimated MRR', fmt.format(summary.estimatedMrr || 0)],
    ['Active subscriptions', numberFmt(summary.activeSubscriptions)],
  ];

  kpiGrid.innerHTML = kpis.map(([label, value]) => `
    <article class="kpi">
      <p class="kpi-label">${label}</p>
      <p class="kpi-value">${value}</p>
    </article>
  `).join('');
}

function renderTimeseries(rows, currency) {
  const fmt = currencyFmt(currency);
  if (!rows.length) {
    timeseriesBody.innerHTML = '<tr><td colspan="5"><p class="empty">No activity found for this range.</p></td></tr>';
    return;
  }

  timeseriesBody.innerHTML = rows.map((row) => `
    <tr>
      <td>${row.date}</td>
      <td>${numberFmt(row.checkoutVisits)}</td>
      <td>${numberFmt(row.emailSignups)}</td>
      <td>${numberFmt(row.paidConversions)}</td>
      <td>${fmt.format(row.grossRevenue || 0)}</td>
    </tr>
  `).join('');
}

function renderNotes(notes) {
  notesList.innerHTML = notes.map((note) => `<li>${note}</li>`).join('');
}

async function loadAnalytics() {
  const days = Number(rangeDays.value || 30);
  statusBanner.textContent = 'Loading analytics…';

  try {
    const response = await fetch(`/api/creator-analytics/${slug}?days=${days}`);
    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }

    const payload = await response.json();
    const { summary, timeseries, notes, currency } = payload;

    statusBanner.textContent = `Showing last ${payload.rangeDays} days for ${payload.creator}.`;
    renderKpis(summary, currency);
    renderTimeseries(timeseries, currency);
    renderNotes(notes || []);
  } catch (error) {
    statusBanner.textContent = `Could not load analytics: ${error.message}`;
    kpiGrid.innerHTML = '';
    timeseriesBody.innerHTML = '';
    notesList.innerHTML = '<li>Check Stripe configuration and ensure creator metadata is attached to checkout sessions.</li>';
  }
}

refreshButton.addEventListener('click', loadAnalytics);
rangeDays.addEventListener('change', loadAnalytics);

loadAnalytics();
