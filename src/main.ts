import './style.css';
import type { DutyRole, RoosterData } from './types.js';
import { downloadIcsFile } from './ics-builder.js';

let roosterData: RoosterData | null = null;
let selectedPerson: string = '';
let activeRoleFilter: string = 'all';

// DOM Elements
const searchInput = document.getElementById('person-search') as HTMLInputElement;
const clearSearchBtn = document.getElementById('clear-search-btn') as HTMLButtonElement;
const personSelect = document.getElementById('person-select') as HTMLSelectElement;

const placeholderState = document.getElementById('placeholder-state') as HTMLElement;
const personDashboard = document.getElementById('person-dashboard') as HTMLElement;

const personAvatar = document.getElementById('person-avatar') as HTMLElement;
const selectedPersonName = document.getElementById('selected-person-name') as HTMLElement;
const dutiesCountText = document.getElementById('duties-count-text') as HTMLElement;
const statsChipsContainer = document.getElementById('stats-chips-container') as HTMLElement;
const downloadIcsBtn = document.getElementById('download-ics-btn') as HTMLButtonElement;

const roleFilterTabs = document.getElementById('role-filter-tabs') as HTMLElement;
const dutiesListContainer = document.getElementById('duties-list-container') as HTMLElement;
const lastUpdatedText = document.getElementById('last-updated-text') as HTMLElement;
const seasonBadge = document.getElementById('season-badge') as HTMLElement;

/**
 * Format ISO date string into Dutch display string (e.g., "Zaterdag 14 nov 2026")
 */
function formatDutchDate(isoDate: string): string {
  try {
    const [year, month, day] = isoDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayNames = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
    const monthNames = [
      'jan', 'feb', 'mrt', 'apr', 'mei', 'jun',
      'jul', 'aug', 'sep', 'okt', 'nov', 'dec'
    ];
    return `${dayNames[date.getDay()]} ${day} ${monthNames[date.getMonth()]} ${year}`;
  } catch {
    return isoDate;
  }
}

/**
 * Format ISO datetime string for display
 */
function formatLastUpdated(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

/**
 * Filter persons list based on search input
 */
function updatePersonDropdownOptions(filterText: string = '') {
  if (!roosterData) return;

  const currentValue = personSelect.value;
  personSelect.innerHTML = '<option value="">-- Kies een naam uit de lijst --</option>';

  const filtered = roosterData.persons.filter(p =>
    p.toLowerCase().includes(filterText.toLowerCase().trim())
  );

  for (const person of filtered) {
    const option = document.createElement('option');
    option.value = person;
    option.textContent = person;
    if (person === currentValue || person === selectedPerson) {
      option.selected = true;
    }
    personSelect.appendChild(option);
  }
}

/**
 * Select a person and render their duties
 */
function selectPerson(personName: string, updateUrl: boolean = true) {
  if (!roosterData) return;
  selectedPerson = personName;

  if (updateUrl) {
    const url = new URL(window.location.href);
    if (personName) {
      url.searchParams.set('naam', personName);
    } else {
      url.searchParams.delete('naam');
    }
    window.history.replaceState({}, '', url.toString());
  }

  if (personSelect.value !== personName) {
    personSelect.value = personName;
  }

  if (!personName) {
    placeholderState.style.display = 'flex';
    personDashboard.style.display = 'none';
    return;
  }

  placeholderState.style.display = 'none';
  personDashboard.style.display = 'flex';

  renderPersonDashboard();
}

/**
 * Render details, chips, and match cards for the selected person
 */
function renderPersonDashboard() {
  if (!roosterData || !selectedPerson) return;

  const personDuties = roosterData.duties.filter(d => d.person === selectedPerson);

  // Avatar and Title
  personAvatar.textContent = selectedPerson.charAt(0).toUpperCase();
  selectedPersonName.textContent = selectedPerson;
  dutiesCountText.textContent = `${personDuties.length} ${personDuties.length === 1 ? 'dienst' : 'diensten'} toegewezen`;

  // Count per role
  const roleCounts: Record<DutyRole, number> = {
    'Scheidsrechter': 0,
    'W-tafel': 0,
    'Toezichthouder': 0,
    'Reanimatie': 0,
  };

  for (const duty of personDuties) {
    for (const role of duty.roles) {
      if (roleCounts[role] !== undefined) {
        roleCounts[role]++;
      }
    }
  }

  // Render Stats Chips
  statsChipsContainer.innerHTML = '';
  const chipsConfig: { role: DutyRole; label: string; chipClass: string; icon: string }[] = [
    { role: 'Scheidsrechter', label: 'Scheidsrechter', chipClass: 'chip-scheidsrechter', icon: '🟨' },
    { role: 'W-tafel', label: 'W-tafel', chipClass: 'chip-wtafel', icon: '⏱️' },
    { role: 'Toezichthouder', label: 'Toezichthouder', chipClass: 'chip-toezicht', icon: '👁️' },
    { role: 'Reanimatie', label: 'Reanimatie', chipClass: 'chip-reanimatie', icon: '❤️' },
  ];

  for (const config of chipsConfig) {
    const count = roleCounts[config.role];
    if (count > 0) {
      const chip = document.createElement('div');
      chip.className = `chip ${config.chipClass}`;
      chip.innerHTML = `<span>${config.icon}</span> <span>${count}x ${config.label}</span>`;
      statsChipsContainer.appendChild(chip);
    }
  }

  // Update Filter Tabs with counts
  const filterTabsConfig = [
    { filter: 'all', label: 'Alle diensten', count: personDuties.length },
    { filter: 'Scheidsrechter', label: 'Scheidsrechter', count: roleCounts['Scheidsrechter'] },
    { filter: 'W-tafel', label: 'W-tafel', count: roleCounts['W-tafel'] },
    { filter: 'Toezichthouder', label: 'Toezichthouder', count: roleCounts['Toezichthouder'] },
    { filter: 'Reanimatie', label: 'Reanimatie', count: roleCounts['Reanimatie'] },
  ];

  roleFilterTabs.innerHTML = '';
  for (const item of filterTabsConfig) {
    const btn = document.createElement('button');
    btn.className = `filter-tab ${activeRoleFilter === item.filter ? 'active' : ''}`;
    btn.setAttribute('data-filter', item.filter);
    btn.innerHTML = `<span>${item.label}</span> <span class="tab-count">${item.count}</span>`;
    roleFilterTabs.appendChild(btn);
  }

  renderDutiesList();
}

/**
 * Render the filtered duties list
 */
function renderDutiesList() {
  if (!roosterData || !selectedPerson) return;

  let duties = roosterData.duties.filter(d => d.person === selectedPerson);

  if (activeRoleFilter !== 'all') {
    duties = duties.filter(d => d.roles.includes(activeRoleFilter as DutyRole));
  }

  dutiesListContainer.innerHTML = '';

  if (duties.length === 0) {
    dutiesListContainer.innerHTML = `
      <div class="card empty-state" style="padding: 2rem 1rem;">
        <p>Geen diensten gevonden voor het filter "${activeRoleFilter}".</p>
      </div>
    `;
    return;
  }

  for (const duty of duties) {
    const card = document.createElement('div');
    card.className = 'duty-card';
    card.setAttribute('data-roles', duty.roles.join(' '));

    const poolLower = (duty.pool || '').toLowerCase();
    const isCaribabad = poolLower.includes('caribabad');
    const isBerenschot = poolLower.includes('berenschot');
    const poolType = isCaribabad ? 'caribabad' : isBerenschot ? 'berenschot' : 'home';
    card.setAttribute('data-pool', poolType);

    const formattedDate = formatDutchDate(duty.date);
    const roleBadgesHtml = duty.roles
      .map(role => {
        const roleBadgeClass = `role-badge-${role.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        return `<span class="role-badge ${roleBadgeClass}">${role}</span>`;
      })
      .join('');

    const isLingeHome = duty.homeTeam.includes('De Linge/PCG');
    const isLingeAway = duty.awayTeam.includes('De Linge/PCG');

    const homeHtml = isLingeHome
      ? `<span class="team-lingepcg">${duty.homeTeam}</span>`
      : `<span>${duty.homeTeam}</span>`;

    const awayHtml = isLingeAway
      ? `<span class="team-lingepcg">${duty.awayTeam}</span>`
      : `<span>${duty.awayTeam}</span>`;

    card.innerHTML = `
      <div class="duty-card-header">
        <div class="duty-datetime">
          <span class="duty-date">${formattedDate}</span>
          <span class="duty-time">${duty.time} uur</span>
        </div>
        <div class="duty-roles">
          ${roleBadgesHtml}
        </div>
      </div>

      <div class="match-teams">
        ${homeHtml}
        <span class="vs-badge">vs</span>
        ${awayHtml}
      </div>

      <div class="duty-pool pool-${poolType}">
        <span class="pool-dot"></span>
        <span class="pool-icon">📍</span>
        <span class="pool-name">${duty.pool || 'Locatie niet gespecificeerd'}</span>
      </div>
    `;

    dutiesListContainer.appendChild(card);
  }
}

/**
 * Initialize application
 */
async function init() {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/rooster.json`);
    if (!response.ok) {
      throw new Error(`Kon data/rooster.json niet laden: ${response.statusText}`);
    }
    roosterData = await response.json();

    if (!roosterData) return;

    // Set last updated and season
    if (roosterData.season) {
      seasonBadge.textContent = `Seizoen ${roosterData.season}`;
    }
    if (roosterData.lastUpdated) {
      lastUpdatedText.textContent = `Laatste update: ${formatLastUpdated(roosterData.lastUpdated)}`;
    }

    // Populate dropdown
    updatePersonDropdownOptions();

    // Populate quick suggest chips
    const quickChipsContainer = document.getElementById('quick-chips-container');
    if (quickChipsContainer && roosterData.persons.length > 0) {
      // Pick a few recognizable names
      const sampleNames = ['Nicky', 'Kyra', 'Lucas', 'Timon', 'Gerrit Sr', 'Gaël', 'Nick'].filter(
        name => roosterData!.persons.includes(name)
      );
      // If none matched, take the first 6
      const namesToShow = sampleNames.length > 0 ? sampleNames : roosterData.persons.slice(0, 6);

      quickChipsContainer.innerHTML = '';
      for (const name of namesToShow) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'quick-chip';
        chip.textContent = name;
        chip.addEventListener('click', () => {
          selectPerson(name);
        });
        quickChipsContainer.appendChild(chip);
      }
    }

    // Check URL query parameters for default selected person
    const urlParams = new URLSearchParams(window.location.search);
    const nameParam = urlParams.get('naam');

    if (nameParam && roosterData.persons.includes(nameParam)) {
      selectPerson(nameParam, false);
    } else {
      selectPerson('', false);
    }

    // Event Listeners
    personSelect.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      selectPerson(target.value);
    });

    searchInput.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value;
      clearSearchBtn.style.display = query ? 'flex' : 'none';
      updatePersonDropdownOptions(query);

      // If exact match found, select automatically
      const exactMatch = roosterData?.persons.find(
        p => p.toLowerCase() === query.toLowerCase().trim()
      );
      if (exactMatch) {
        selectPerson(exactMatch);
      }
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearSearchBtn.style.display = 'none';
      updatePersonDropdownOptions();
      searchInput.focus();
    });

    downloadIcsBtn.addEventListener('click', () => {
      if (!roosterData || !selectedPerson) return;
      const personDuties = roosterData.duties.filter(d => d.person === selectedPerson);
      downloadIcsFile(selectedPerson, personDuties);
    });

    // Filter tab buttons
    roleFilterTabs.addEventListener('click', (e) => {
      const button = (e.target as HTMLElement).closest('.filter-tab') as HTMLButtonElement | null;
      if (!button) return;

      activeRoleFilter = button.getAttribute('data-filter') || 'all';

      roleFilterTabs.querySelectorAll('.filter-tab').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      renderDutiesList();
    });

  } catch (error) {
    console.error('Initialisatiefout:', error);
    placeholderState.innerHTML = `
      <div class="empty-icon">⚠️</div>
      <h2>Er ging iets mis</h2>
      <p>Het rooster kon niet geladen worden. Controleer of <code>public/data/rooster.json</code> aanwezig is.</p>
    `;
  }
}

// Start application
void init();
