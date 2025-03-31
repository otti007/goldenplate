// Supabase configuration
const SUPABASE_URL = 'https://ufuwsxtyvaeupqkzuuhb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmdXdzeHR5dmFldXBxa3p1dWhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxNDI5MDQsImV4cCI6MjA1NzcxODkwNH0.hQS9uczPcIQSxYoX30wWItK1NvxGTzDHA68Ma8lUVVg';
// Create Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM Elements
const homeView = document.getElementById('home-view');
const schoolView = document.getElementById('school-view');
const sessionView = document.getElementById('session-view');
const resultsView = document.getElementById('results-view');
const loadingIndicator = document.getElementById('loading-indicator');

// Home view elements
const schoolNameInput = document.getElementById('schoolName');
const addSchoolBtn = document.getElementById('add-school-btn');
const schoolsList = document.getElementById('schools-list');
const noSchoolsMessage = document.getElementById('no-schools-message');

// School view elements
const schoolDetailTitle = document.getElementById('school-detail-title');
const totalSessions = document.getElementById('total-sessions');
const totalPlates = document.getElementById('total-plates');
const totalClean = document.getElementById('total-clean');
const totalDirty = document.getElementById('total-dirty');
const createSessionBtn = document.getElementById('create-session-btn');
const backToHomeBtn = document.getElementById('back-to-home-btn');
const schoolSessionsList = document.getElementById('school-sessions-list');
const noSchoolSessionsMessage = document.getElementById('no-school-sessions-message');

// Session view elements
const backToSchoolBtn = document.getElementById('back-to-school-btn');
const schoolTitle = document.getElementById('school-title');
const cleanPlateBtn = document.getElementById('clean-plate-btn');
const dirtyPlateBtn = document.getElementById('dirty-plate-btn');
const cleanCount = document.getElementById('clean-count');
const dirtyCount = document.getElementById('dirty-count');
const endSessionBtn = document.getElementById('end-session-btn');
const cancelSessionBtn = document.getElementById('cancel-session-btn');
const shareSessionBtn = document.getElementById('share-session-btn');
const sharedSessionIndicator = document.getElementById('shared-session-indicator');

// Results view elements
const backToSchoolFromResultsBtn = document.getElementById('back-to-school-from-results-btn');
const resultSchoolName = document.getElementById('result-school-name');
const resultsSummary = document.getElementById('results-summary');
const homeBtn = document.getElementById('home-btn');
const newSessionBtn = document.getElementById('new-session-btn');

// Name input modal elements
const nameInputModal = document.getElementById('nameInputModal');
const modalTitle = document.getElementById('modalTitle');
const studentNameInput = document.getElementById('studentNameInput');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const modalSubmitBtn = document.getElementById('modalSubmitBtn');

// Current data
let currentSchool = {
    id: null,
    name: ''
};

let currentSession = {
    id: null,
    schoolId: null,
    schoolName: '',
    cleanPlates: 0,
    dirtyPlates: 0,
    date: null,
    isShared: false
};

// Subscription references
let sessionSubscription = null;
let plateSubscription = null;

// Chart instance
let resultsChart = null;

// Track whether we're adding a clean or dirty plate
let isAddingCleanPlate = true;

// Show/hide loading indicator
function showLoading() {
    loadingIndicator.classList.remove('hidden');
}

function hideLoading() {
    loadingIndicator.classList.add('hidden');
}

// Error handling
function handleError(error) {
    console.error('Error:', error);
    alert(`An error occurred: ${error.message}`);
    hideLoading();
}

// View management
function showView(view) {
    homeView.classList.add('hidden');
    schoolView.classList.add('hidden');
    sessionView.classList.add('hidden');
    resultsView.classList.add('hidden');
    
    view.classList.remove('hidden');
}

// Initialize the application
async function initApp() {
    // Load schools
    await loadSchools();
    
    // Add event listeners
    addSchoolBtn.addEventListener('click', addSchool);
    backToHomeBtn.addEventListener('click', goToHome);
    createSessionBtn.addEventListener('click', createNewSession);
    backToSchoolBtn.addEventListener('click', goToSchool);
    cleanPlateBtn.addEventListener('click', addCleanPlate);
    document.getElementById('dirty-plate-quick-btn').addEventListener('click', addDirtyPlateQuick);
    document.getElementById('dirty-plate-name-btn').addEventListener('click', addDirtyPlateWithNamePrompt);
    endSessionBtn.addEventListener('click', () => {
        endSession().catch(error => handleError(error));
    });
    cancelSessionBtn.addEventListener('click', cancelSession);
    backToSchoolFromResultsBtn.addEventListener('click', goToSchool);
    homeBtn.addEventListener('click', goToHome);
    newSessionBtn.addEventListener('click', createNewSession);
    shareSessionBtn.addEventListener('click', copySessionLink);
    
    // Add event listeners for name input modal
    modalCancelBtn.addEventListener('click', closeNamePrompt);
    modalSubmitBtn.addEventListener('click', submitNameAndAddPlate);
    
    // Allow pressing Enter in the name input
    studentNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitNameAndAddPlate();
        }
    });
    
    // Input validation
    schoolNameInput.addEventListener('input', validateSchoolName);
    schoolNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addSchool();
        }
    });
    
    // Initial button state
    validateSchoolName();
    
    // Set up share session functionality
    setupShareSession();
}

// Validate school name input
function validateSchoolName() {
    addSchoolBtn.disabled = !schoolNameInput.value.trim();
}

// Load schools from Supabase
async function loadSchools() {
    showLoading();
    
    try {
        // Query schools from Supabase, ordered by name
        const { data, error } = await supabaseClient
            .from('schools')
            .select('id, name')
            .order('name');
        
        if (error) throw error;
        
        // Update the schools list
        if (data && data.length > 0) {
            noSchoolsMessage.classList.add('hidden');
            schoolsList.innerHTML = '';
            
            data.forEach(school => {
                const schoolItem = document.createElement('div');
                schoolItem.className = 'school-item';
                schoolItem.dataset.id = school.id;
                schoolItem.innerHTML = `
                    <h4>${school.name}</h4>
                    <div class="school-stats">
                        <span>Click to view details</span>
                    </div>
                `;
                
                // Add click event to view school details
                schoolItem.addEventListener('click', () => viewSchool(school));
                
                schoolsList.appendChild(schoolItem);
            });
        } else {
            noSchoolsMessage.classList.remove('hidden');
        }
    } catch (error) {
        handleError(error);
    } finally {
        hideLoading();
    }
}

// Add a new school
async function addSchool() {
    const schoolName = schoolNameInput.value.trim();
    
    if (!schoolName) return;
    
    showLoading();
    
    try {
        // Check if school already exists
        const { data: existingSchools, error: checkError } = await supabaseClient
            .from('schools')
            .select('id')
            .eq('name', schoolName);
        
        if (checkError) throw checkError;
        
        if (existingSchools && existingSchools.length > 0) {
            alert(`A school with the name "${schoolName}" already exists.`);
            hideLoading();
            return;
        }
        
        // Create a new school in Supabase
        const { data, error } = await supabaseClient
            .from('schools')
            .insert([{ name: schoolName }])
            .select();
        
        if (error) throw error;
        
        // Clear input
        schoolNameInput.value = '';
        
        // Reload schools
        await loadSchools();
        
        // View the new school
        if (data && data.length > 0) {
            viewSchool(data[0]);
        }
    } catch (error) {
        handleError(error);
    } finally {
        hideLoading();
    }
}

// View school details
async function viewSchool(school) {
    showLoading();
    
    try {
        // Set current school
        currentSchool = {
            id: school.id,
            name: school.name
        };
        
        // Update UI
        schoolDetailTitle.textContent = school.name;
        
        // Reset the sessions list to ensure we don't see sessions from other schools
        schoolSessionsList.innerHTML = '';
        noSchoolSessionsMessage.classList.remove('hidden');
        
        // Get school statistics
        await loadSchoolStats();
        
        // Load school sessions
        await loadSchoolSessions();
        
        // Show school view
        showView(schoolView);
    } catch (error) {
        handleError(error);
    } finally {
        hideLoading();
    }
}

// Load school statistics
async function loadSchoolStats() {
    try {
        // Get sessions count
        const { data: sessions, error: sessionsError } = await supabaseClient
            .from('sessions')
            .select('id')
            .eq('school_id', currentSchool.id);
        
        if (sessionsError) throw sessionsError;
        
        const sessionsCount = sessions ? sessions.length : 0;
        
        // Get plates count
        const { data: plates, error: platesError } = await supabaseClient
            .from('plates')
            .select('id, is_clean, session_id')
            .in('session_id', sessions ? sessions.map(s => s.id) : []);
        
        if (platesError) throw platesError;
        
        const platesCount = plates ? plates.length : 0;
        const cleanPlatesCount = plates ? plates.filter(p => p.is_clean).length : 0;
        const dirtyPlatesCount = platesCount - cleanPlatesCount;
        
        // Update UI
        totalSessions.textContent = sessionsCount;
        totalPlates.textContent = platesCount;
        totalClean.textContent = cleanPlatesCount;
        totalDirty.textContent = dirtyPlatesCount;
    } catch (error) {
        console.error('Error loading school stats:', error);
        // Don't throw, just log the error to avoid breaking the flow
    }
}

// Verify session belongs to the current school
function verifySessionSchool(sessionId, callback) {
    showLoading();
    
    supabaseClient
        .from('sessions')
        .select('id, school_id, schools(id, name)')
        .eq('id', sessionId)
        .single()
        .then(({ data, error }) => {
            hideLoading();
            
            if (error) {
                console.error('Error verifying session school:', error);
                alert('Could not verify session details. Please try again.');
                return;
            }
            
            if (data && data.school_id === currentSchool.id) {
                callback(data);
            } else if (data) {
                console.log(`Session belongs to school ${data.schools.name}, not current school ${currentSchool.name}`);
                
                if (confirm(`This session belongs to ${data.schools.name}. Would you like to switch to that school?`)) {
                    // Update current school and then proceed with callback
                    currentSchool = {
                        id: data.school_id,
                        name: data.schools.name
                    };
                    callback(data);
                }
            } else {
                alert('Session not found.');
            }
        });
}

// Load school sessions
async function loadSchoolSessions() {
    try {
        if (!currentSchool.id) {
            console.error('No current school selected');
            return;
        }
        
        console.log(`Loading sessions for school: ${currentSchool.name} (ID: ${currentSchool.id})`);
        
        // Query sessions for the current school
        const { data, error } = await supabaseClient
            .from('sessions')
            .select('id, school_id, clean_plates, dirty_plates, created_at')
            .eq('school_id', currentSchool.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Clear the existing sessions list first
        schoolSessionsList.innerHTML = '';
        
        // Update the sessions list
        if (data && data.length > 0) {
            noSchoolSessionsMessage.classList.add('hidden');
            
            // Filter sessions to ensure they belong to the current school
            const filteredSessions = data.filter(session => session.school_id === currentSchool.id);
            console.log(`Found ${filteredSessions.length} sessions for school ${currentSchool.name}`);
            
            filteredSessions.forEach(session => {
                const sessionDate = new Date(session.created_at);
                const formattedDate = sessionDate.toLocaleDateString() + ' ' + 
                                     sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                const sessionItem = document.createElement('div');
                sessionItem.className = 'session-item';
                sessionItem.dataset.id = session.id;
                sessionItem.dataset.schoolId = session.school_id;
                sessionItem.innerHTML = `
                    <div class="session-date">${formattedDate}</div>
                    <div class="session-stats">
                        <span class="clean-stat">Clean: ${session.clean_plates}</span>
                        <span class="dirty-stat">Dirty: ${session.dirty_plates}</span>
                    </div>
                    <div class="session-actions">
                        <button class="join-session-btn" data-id="${session.id}">Join Session</button>
                    </div>
                `;
                
                // Add click event to view session results
                sessionItem.querySelector('.session-stats').addEventListener('click', () => {
                    // Ensure session belongs to current school before viewing
                    if (session.school_id === currentSchool.id) {
                        viewSessionResults({
                            ...session,
                            school_id: currentSchool.id,
                            school_name: currentSchool.name
                        });
                    } else {
                        console.warn(`Session ${session.id} belongs to school ${session.school_id}, not current school ${currentSchool.id}`);
                        alert('This session belongs to a different school. Please switch to that school to view it.');
                    }
                });
                
                // Add click event to join session
                sessionItem.querySelector('.join-session-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Verify session belongs to this school before joining
                    verifySessionSchool(session.id, (data) => {
                        joinExistingSession(session.id);
                    });
                });
                
                schoolSessionsList.appendChild(sessionItem);
            });
            
            if (filteredSessions.length === 0) {
                noSchoolSessionsMessage.classList.remove('hidden');
            }
        } else {
            noSchoolSessionsMessage.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading school sessions:', error);
        // Don't throw, just log the error to avoid breaking the flow
    }
}

// Create a new session
async function createNewSession() {
    if (!currentSchool.id) return;
    
    showLoading();
    
    try {
        // Create a new session in Supabase
        const { data, error } = await supabaseClient
            .from('sessions')
            .insert([
                { 
                    school_id: currentSchool.id,
                    clean_plates: 0,
                    dirty_plates: 0
                }
            ])
            .select();
        
        if (error) throw error;
        
        // Set current session data
        currentSession = {
            id: data[0].id,
            schoolId: currentSchool.id,
            schoolName: currentSchool.name,
            cleanPlates: 0,
            dirtyPlates: 0,
            date: new Date(data[0].created_at),
            isShared: false
        };
        
        // Update UI
        schoolTitle.textContent = currentSchool.name;
        cleanCount.textContent = '0';
        dirtyCount.textContent = '0';
        
        // Subscribe to real-time updates for this session
        subscribeToSessionUpdates();
        
        // Show session view
        showView(sessionView);
    } catch (error) {
        handleError(error);
    } finally {
        hideLoading();
    }
}

// Join an existing session
async function joinExistingSession(sessionId) {
    showLoading();
    
    try {
        // Get session data
        const { data, error } = await supabaseClient
            .from('sessions')
            .select('id, school_id, clean_plates, dirty_plates, created_at, schools(id, name)')
            .eq('id', sessionId)
            .single();
        
        if (error) throw error;
        
        console.log(`Joining session with ID: ${sessionId}, School ID: ${data.school_id}, School Name: ${data.schools.name}`);
        
        // Set current session data
        currentSession = {
            id: data.id,
            schoolId: data.school_id,
            schoolName: data.schools.name,
            cleanPlates: data.clean_plates,
            dirtyPlates: data.dirty_plates,
            date: new Date(data.created_at),
            isShared: true
        };
        
        // Set current school data
        currentSchool = {
            id: data.school_id,
            name: data.schools.name
        };
        
        // Update UI
        schoolTitle.textContent = currentSession.schoolName;
        cleanCount.textContent = currentSession.cleanPlates.toString();
        dirtyCount.textContent = currentSession.dirtyPlates.toString();
        
        // Show shared session indicator
        sharedSessionIndicator.classList.remove('hidden');
        
        // Subscribe to real-time updates for this session
        subscribeToSessionUpdates();
        
        // Show session view
        showView(sessionView);
    } catch (error) {
        handleError(error);
    } finally {
        hideLoading();
    }
}

// Subscribe to real-time updates for the current session
function subscribeToSessionUpdates() {
    // Unsubscribe from any previous subscriptions
    unsubscribeFromUpdates();
    
    // Subscribe to session updates
    sessionSubscription = supabaseClient
        .channel('session-updates')
        .on('postgres_changes', 
            { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'sessions',
                filter: `id=eq.${currentSession.id}`
            }, 
            (payload) => {
                // Update the session counts in the UI
                if (payload.new) {
                    updateCountWithAnimation(cleanCount, currentSession.cleanPlates, payload.new.clean_plates);
                    updateCountWithAnimation(dirtyCount, currentSession.dirtyPlates, payload.new.dirty_plates);
                    
                    currentSession.cleanPlates = payload.new.clean_plates;
                    currentSession.dirtyPlates = payload.new.dirty_plates;
                }
            }
        )
        .subscribe();
    
    // Subscribe to plate additions for this session
    plateSubscription = supabaseClient
        .channel('plate-updates')
        .on('postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'plates',
                filter: `session_id=eq.${currentSession.id}`
            }, 
            (payload) => {
                // Update local counts when a new plate is added by someone else
                if (payload.new) {
                    if (payload.new.is_clean) {
                        updateCountWithAnimation(cleanCount, currentSession.cleanPlates, currentSession.cleanPlates + 1);
                        currentSession.cleanPlates++;
                    } else {
                        updateCountWithAnimation(dirtyCount, currentSession.dirtyPlates, currentSession.dirtyPlates + 1);
                        currentSession.dirtyPlates++;
                    }
                }
            }
        )
        .subscribe();
}

// Update counter with animation
function updateCountWithAnimation(element, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    // Add animation class
    element.classList.add('count-update');
    
    // Update value
    element.textContent = newValue.toString();
    
    // Remove animation class after animation completes
    setTimeout(() => {
        element.classList.remove('count-update');
    }, 1000);
}

// Unsubscribe from real-time updates
function unsubscribeFromUpdates() {
    if (sessionSubscription) {
        supabaseClient.removeChannel(sessionSubscription);
        sessionSubscription = null;
    }
    
    if (plateSubscription) {
        supabaseClient.removeChannel(plateSubscription);
        plateSubscription = null;
    }
}

// Show name input prompt for adding a plate
function showNamePrompt(isClean) {
    isAddingCleanPlate = isClean;
    modalTitle.textContent = `Enter Name for ${isClean ? 'Clean' : 'Dirty'} Plate`;
    modalSubmitBtn.textContent = 'Submit';
    modalSubmitBtn.className = `modal-submit ${isClean ? '' : 'dirty'}`;
    
    nameInputModal.classList.add('show');
    studentNameInput.value = '';
    setTimeout(() => studentNameInput.focus(), 100);
}

// Close name input prompt
function closeNamePrompt() {
    nameInputModal.classList.remove('show');
}

// Submit name and add plate
function submitNameAndAddPlate() {
    const name = studentNameInput.value.trim();
    closeNamePrompt();
    
    if (isAddingCleanPlate) {
        addCleanPlateWithName(name);
    } else {
        addDirtyPlateWithName(name);
    }
}

// Modify plate adding functions to show the name prompt
function addCleanPlate() {
    showNamePrompt(true);
}

function addDirtyPlate() {
    addDirtyPlateWithName('');
}

// Add a clean plate with name
async function addCleanPlateWithName(name) {
    if (!currentSession.id) return;
    
    showLoading();
    
    try {
        // Ensure name column exists
        await ensureNameColumnExists();
        
        // Create a new plate in Supabase
        const { error } = await supabaseClient
            .from('plates')
            .insert([
                { 
                    session_id: currentSession.id,
                    is_clean: true,
                    name: name
                }
            ]);
        
        if (error) throw error;
        
        // Update current session data
        currentSession.cleanPlates++;
        
        // Update UI
        cleanCount.textContent = currentSession.cleanPlates.toString();
    } catch (error) {
        handleError(error);
    } finally {
        hideLoading();
    }
}

// Add a dirty plate with name (empty string if no name provided)
async function addDirtyPlateWithName(name) {
    if (!currentSession.id) return;
    
    showLoading();
    
    try {
        // Create a new plate in Supabase
        const { error } = await supabaseClient
            .from('plates')
            .insert([
                { 
                    session_id: currentSession.id,
                    is_clean: false,
                    name: name || null
                }
            ]);
        
        if (error) throw error;
        
        // Update current session data
        currentSession.dirtyPlates++;
        
        // Update UI
        dirtyCount.textContent = currentSession.dirtyPlates.toString();
    } catch (error) {
        handleError(error);
    } finally {
        hideLoading();
    }
}

// Ensure name column exists in plates table
async function ensureNameColumnExists() {
    try {
        // Check if column exists by querying with name field
        try {
            const { data, error } = await supabaseClient
                .from('plates')
                .select('name')
                .limit(1);
            
            if (!error) {
                // Column exists
                return true;
            }
        } catch (e) {
            console.log('Name column check failed:', e);
        }
        
        // Try to add column using RPC
        try {
            const { error } = await supabaseClient.rpc('exec_sql', {
                query: `ALTER TABLE plates ADD COLUMN IF NOT EXISTS name TEXT;`
            });
            
            if (error) {
                throw error;
            } else {
                console.log('Name column added to plates table');
                return true;
            }
        } catch (rpcError) {
            console.error('Error adding name column:', rpcError);
            alert('Please run the fix_relationship.sql script in Supabase SQL Editor to add the name column.');
            return false;
        }
    } catch (error) {
        console.error('Error checking name column:', error);
        return false;
    }
}

// End the current session and show results
async function endSession() {
    if (!currentSession.id) return;
    
    // Check if at least one plate has been added
    if (currentSession.cleanPlates === 0 && currentSession.dirtyPlates === 0) {
        alert('Please add at least one plate before ending the session.');
        return;
    }
    
    showLoading();
    
    try {
        // Update the session in Supabase with final counts
        const { error } = await supabaseClient
            .from('sessions')
            .update({ 
                clean_plates: currentSession.cleanPlates,
                dirty_plates: currentSession.dirtyPlates
            })
            .eq('id', currentSession.id);
        
        if (error) throw error;
        
        // Unsubscribe from session updates
        unsubscribeFromUpdates();
        
        // Show results view
        await displayResults();
    } catch (error) {
        handleError(error);
    } finally {
        hideLoading();
    }
}

// Setup share session functionality
function setupShareSession() {
    // Check if we have a session ID in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');
    
    if (sessionId) {
        // Join the session from the URL
        joinExistingSession(sessionId);
    }
}

// Copy session link to clipboard
function copySessionLink() {
    if (!currentSession.id) return;
    
    // Create the share URL
    const shareUrl = `${window.location.origin}${window.location.pathname}?session=${currentSession.id}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl)
        .then(() => {
            alert('Session link copied to clipboard! Share it with others to collaborate.');
            
            // Mark session as shared
            currentSession.isShared = true;
            sharedSessionIndicator.classList.remove('hidden');
        })
        .catch(err => {
            console.error('Failed to copy session link: ', err);
            alert('Failed to copy link. Please copy this URL manually: ' + shareUrl);
        });
}

// Display session results
async function displayResults() {
    showLoading();
    
    try {
        // Update UI
        resultSchoolName.textContent = currentSession.schoolName;
        
        // Fetch clean plates with names for this session
        const { data: cleanPlatesWithNames, error: cleanPlatesError } = await supabaseClient
            .from('plates')
            .select('name')
            .eq('session_id', currentSession.id)
            .eq('is_clean', true)
            .not('name', 'is', null)
            .not('name', 'eq', '');
            
        // Fetch dirty plates with names for this session
        const { data: dirtyPlatesWithNames, error: dirtyPlatesError } = await supabaseClient
            .from('plates')
            .select('name')
            .eq('session_id', currentSession.id)
            .eq('is_clean', false)
            .not('name', 'is', null)
            .not('name', 'eq', '');
        
        if (cleanPlatesError) throw cleanPlatesError;
        if (dirtyPlatesError) throw dirtyPlatesError;
        
        // Create chart
        const ctx = document.getElementById('results-chart').getContext('2d');
        
        // Destroy previous chart if it exists
        if (resultsChart) {
            resultsChart.destroy();
        }
        
        // Create new chart
        resultsChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Clean Plates', 'Dirty Plates'],
                datasets: [{
                    data: [currentSession.cleanPlates, currentSession.dirtyPlates],
                    backgroundColor: [
                        'rgba(76, 175, 80, 0.7)', // Clean - green
                        'rgba(244, 67, 54, 0.7)'  // Dirty - red
                    ],
                    borderColor: [
                        'rgba(76, 175, 80, 1)',
                        'rgba(244, 67, 54, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: `Plate Distribution for ${currentSession.schoolName}`,
                        font: {
                            size: 16
                        }
                    }
                }
            }
        });
        
        // Update stats summary
        const totalPlates = currentSession.cleanPlates + currentSession.dirtyPlates;
        const cleanPercentage = ((currentSession.cleanPlates / totalPlates) * 100).toFixed(1);
        const dirtyPercentage = ((currentSession.dirtyPlates / totalPlates) * 100).toFixed(1);
        
        // Get random winners
        let awardsText = '';
        
        // Golden Plate Award
        if (cleanPlatesWithNames && cleanPlatesWithNames.length > 0) {
            const randomCleanIndex = Math.floor(Math.random() * cleanPlatesWithNames.length);
            const randomCleanName = cleanPlatesWithNames[randomCleanIndex].name;
            
            if (randomCleanName) {
                awardsText += `
                    <p class="clean-plate-highlight">
                        <i class="fas fa-trophy"></i> 
                        <span>${randomCleanName}</span> won the Golden Plate Award! 
                        <i class="fas fa-award"></i>
                    </p>
                    <p class="award-description">For outstanding achievement in keeping their plate clean!</p>`;
            }
        }
        
        // Red Plate Award
        if (dirtyPlatesWithNames && dirtyPlatesWithNames.length > 0) {
            const randomDirtyIndex = Math.floor(Math.random() * dirtyPlatesWithNames.length);
            const randomDirtyName = dirtyPlatesWithNames[randomDirtyIndex].name;
            
            if (randomDirtyName) {
                awardsText += `
                    <p class="red-plate-highlight">
                        <i class="fas fa-exclamation-circle"></i> 
                        <span>${randomDirtyName}</span> won the Red Plate Award! 
                        <i class="fas fa-utensils"></i>
                    </p>
                    <p class="award-description red">For leaving their plate dirty!</p>`;
            }
        }
        
        // If no names were recorded
        if (!awardsText && (currentSession.cleanPlates > 0 || currentSession.dirtyPlates > 0)) {
            awardsText = `
                <p class="clean-plate-highlight">
                    <i class="fas fa-info-circle"></i> 
                    We had ${currentSession.cleanPlates} clean and ${currentSession.dirtyPlates} dirty plates, but no names were recorded. 
                    <i class="fas fa-utensils"></i>
                </p>`;
        }
        
        resultsSummary.innerHTML = `
            <p><span class="highlight">School:</span> ${currentSession.schoolName}</p>
            <p><span class="highlight">Total Plates:</span> ${totalPlates}</p>
            <p><span class="highlight">Clean Plates:</span> ${currentSession.cleanPlates} (${cleanPercentage}%)</p>
            <p><span class="highlight">Dirty Plates:</span> ${currentSession.dirtyPlates} (${dirtyPercentage}%)</p>
            ${awardsText}
        `;
        
        // Show results view
        showView(resultsView);
    } catch (error) {
        handleError(error);
    } finally {
        hideLoading();
    }
}

// View a previous session's results
async function viewSessionResults(session) {
    showLoading();
    
    try {
        // Log session details for debugging
        console.log(`Viewing session results: Session ID: ${session.id}, School ID: ${session.school_id}, School Name: ${session.school_name}`);
        
        // Unsubscribe from any active subscriptions
        unsubscribeFromUpdates();
        
        // Set current session data from the selected session
        currentSession = {
            id: session.id,
            schoolId: session.school_id,
            schoolName: session.school_name,
            cleanPlates: session.clean_plates,
            dirtyPlates: session.dirty_plates,
            date: new Date(session.created_at)
        };
        
        // Set current school if viewing from home
        if (!currentSchool.id || currentSchool.id !== session.school_id) {
            currentSchool = {
                id: session.school_id,
                name: session.school_name
            };
        }
        
        // Display results
        await displayResults();
    } catch (error) {
        handleError(error);
    } finally {
        hideLoading();
    }
}

// Cancel the current session
function cancelSession() {
    if (confirm('Are you sure you want to cancel this session? All data will be lost.')) {
        // Unsubscribe from session updates
        unsubscribeFromUpdates();
        
        // Delete the session from Supabase
        if (currentSession.id) {
            supabaseClient
                .from('sessions')
                .delete()
                .eq('id', currentSession.id)
                .then(({ error }) => {
                    if (error) console.error('Error deleting session:', error);
                });
        }
        
        // Go back to school view
        goToSchool();
    }
}

// Go to home view
async function goToHome() {
    // Unsubscribe from any active subscriptions
    unsubscribeFromUpdates();
    
    // Reset current school and session
    resetCurrentData();
    
    // Reload schools
    await loadSchools();
    
    // Show home view
    showView(homeView);
}

// Go to school view
async function goToSchool() {
    if (!currentSchool.id) {
        goToHome();
        return;
    }
    
    // Unsubscribe from any active subscriptions
    unsubscribeFromUpdates();
    
    // Reset current session
    currentSession = {
        id: null,
        schoolId: null,
        schoolName: '',
        cleanPlates: 0,
        dirtyPlates: 0,
        date: null,
        isShared: false
    };
    
    // Reload school stats and sessions
    await Promise.all([
        loadSchoolStats(),
        loadSchoolSessions()
    ]);
    
    // Show school view
    showView(schoolView);
}

// Reset current data
function resetCurrentData() {
    currentSchool = {
        id: null,
        name: ''
    };
    
    currentSession = {
        id: null,
        schoolId: null,
        schoolName: '',
        cleanPlates: 0,
        dirtyPlates: 0,
        date: null,
        isShared: false
    };
    
    // Hide shared session indicator
    if (sharedSessionIndicator) {
        sharedSessionIndicator.classList.add('hidden');
    }
}

// Add a dirty plate without name (quick count)
async function addDirtyPlateQuick() {
    if (!currentSession.id) return;
    
    showLoading();
    
    try {
        // Create a new plate in Supabase
        const { error } = await supabaseClient
            .from('plates')
            .insert([
                { 
                    session_id: currentSession.id,
                    is_clean: false,
                    name: null
                }
            ]);
        
        if (error) throw error;
        
        // Update current session data
        currentSession.dirtyPlates++;
        
        // Update UI
        dirtyCount.textContent = currentSession.dirtyPlates.toString();
    } catch (error) {
        handleError(error);
    } finally {
        hideLoading();
    }
}

// Show name prompt for dirty plate
function addDirtyPlateWithNamePrompt() {
    showNamePrompt(false);
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp); 