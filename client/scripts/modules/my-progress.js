(() => {

    const myWorkoutsTab   = document.getElementById("myWorkoutsTab");
    const myProgressTab   = document.getElementById("myProgressTab");
    const myWorkoutsSection = document.getElementById("myWorkoutsSection");
    const myProgressSection = document.getElementById("myProgressSection");

    function handleWorkoutsTab() {
        localStorage.setItem("lastSelectedTab", "myWorkouts");
        myWorkoutsTab.classList.add("active");
        myProgressTab.classList.remove("active");
        myWorkoutsSection.classList.add("active");
        myProgressSection.classList.remove("active");
    
        const weekSelectorFrame = document.querySelector(".week-selector-frame");
        const daySelectorFrame  = document.querySelector(".day-selector-frame");
        if (weekSelectorFrame) weekSelectorFrame.style.display = "block";
        if (daySelectorFrame)  daySelectorFrame.style.display  = "block";
      }
    
      function handleProgressTab() {
        localStorage.setItem("lastSelectedTab", "myProgress");
        myProgressTab.classList.add("active");
        myWorkoutsTab.classList.remove("active");
        myProgressSection.classList.add("active");
        myWorkoutsSection.classList.remove("active");
    
        const weekSelectorFrame = document.querySelector(".week-selector-frame");
        const daySelectorFrame  = document.querySelector(".day-selector-frame");
        if (weekSelectorFrame) weekSelectorFrame.style.display = "none";
        if (daySelectorFrame)  daySelectorFrame.style.display  = "none";
    
        // Everything that makes the Progress tab tick:
        if (typeof hasPurchasedAWT !== "undefined" && hasPurchasedAWT) {
          document.getElementById("myProgressOverview").style.display = "block";
          document.getElementById("noProgressDataMessage").style.display = "none";
          updateProgressScoreAndMessages();
          renderWeeklyRecapAndImprovements();
          showBodyCompositionSection();
          showTodaysTipIfAny();
    
          let selectedExercise = localStorage.getItem("strengthTrendsSelectedExercise");
          if (!selectedExercise && window.flattenedExercises?.length) {
            selectedExercise = flattenedExercises[0].name;
          }
          buildTrendChartsFor(selectedExercise);
          buildCoachInsightsFor(selectedExercise);
        } else {
          document.getElementById("myProgressOverview").style.display = "none";
          document.getElementById("noProgressDataMessage").style.display = "none";
          renderMyProgressForCore();
        }
      }
    
      // Set up the click listeners ONCE the DOM is ready
      document.addEventListener("DOMContentLoaded", () => {
        if (myWorkoutsTab && myProgressTab) {
          myWorkoutsTab.addEventListener("click", handleWorkoutsTab);
          myProgressTab.addEventListener("click", handleProgressTab);
        }
        const lastTab = localStorage.getItem("lastSelectedTab");
        if (lastTab === "myProgress") {
          myProgressTab.click();
        } else {
          myWorkoutsTab.click();
        }
        // Restore whichever tab was last used
        if (localStorage.getItem("lastSelectedTab") === "myProgress") {
          handleProgressTab();
        }
      });

      function renderWeeklyRecapAndImprovements() {
        // 1) Read the user's "active" workout week from localStorage (default to 1 if not set)
        const activeWeek = parseInt(localStorage.getItem("activeWorkoutWeek") || "1", 10);
      
        // If the user is on Week 1, there's no "previous" week to show.
        if (activeWeek === 1) {
          showWeek1WelcomeCard();  // e.g. “No data yet” message for Week 1
          hideImprovementsSection();
          return;
        }
      
        // 2) The “previous” week we want to recap is (activeWeek - 1)
        const lastWeekNumber = activeWeek - 1;
        console.log(`[renderWeeklyRecapAndImprovements] Preparing recap for Week ${lastWeekNumber}`);
      
        // 3) Get the locked recap stats for that week (if already generated, they remain unchanged)
        const stats = getLockedWeeklyRecap(lastWeekNumber);
      
        // 4) Update the subheading to show the specific week recap
        const recapSubheading = document.getElementById("weeklyRecapSubheading");
        if (recapSubheading) {
          recapSubheading.textContent = `Your Week ${lastWeekNumber} Recap`;
        }
      
        // 5) Build the 4 mandatory recap cards (Workouts Completed, Total Weight, Total Sets, Total Reps)
        buildWeeklyRecapCards(stats);
        initSwipeableCards("weeklyRecapWrapper", "weeklyRecapCards", "weeklyRecapDots");
      
        // 6) Check if there's a highlight (e.g. "Most Improved Lift", high XP, or high completion) and add it.
        // const highlight = pickHighlightIfAny(stats);
        // if (highlight) {
        //   addHighlightCard(highlight);
        // }
        renderRecapDots();
      
        // 7) Check for “Areas for Improvement” (which now includes our locked weekly data)
        const improvements = gatherAreasForImprovement(stats);
        if (improvements.length === 0) {
          hideImprovementsSection(true); // e.g. “You're doing great!” message
        } else {
          showImprovementsSection(improvements);
          initSwipeableCards("areasImprovementWrapper", "areasImprovementCards", "areasImprovementDots");
        }
      }
      
      function showWeek1WelcomeCard() {
        const recapSubheading = document.getElementById("weeklyRecapSubheading");
        const recapWrapper = document.getElementById("weeklyRecapWrapper");
        const recapCards = document.getElementById("weeklyRecapCards");
        const recapDots = document.getElementById("weeklyRecapDots");
      
        if (!recapSubheading || !recapWrapper || !recapCards || !recapDots) return;
      
        recapSubheading.style.display = "block";
        recapWrapper.style.display = "block";
        recapDots.innerHTML = "";
      
        // Single card
        recapCards.innerHTML = `
          <div class="recap-card">
            <p class="recap-card-description" style="margin: 0; padding: 0;">
              Welcome to your first week! Your Weekly Recap will show your progress,
              highlights, and improvements each week. Stay consistent, and next week's 
              recap will showcase your achievements!
            </p>
          </div>
        `;
      }
      
      function getWeeklyStats(weekNumber) {
        // Determine the zero-based weekIndex that corresponds to the given weekNumber.
        let weekIndex = -1;
        for (let i = 0; i < twelveWeekProgram.length; i++) {
          if (twelveWeekProgram[i].week === weekNumber) {
            weekIndex = i;
            break;
          }
        }
      
        if (weekIndex === -1) {
          console.warn(`[getWeeklyStats] No data found for week ${weekNumber}.`);
          // Fallback: no data available.
          return {
            workoutsCompleted: 0,
            totalWeight: 0,
            totalSets: 0,
            totalReps: 0,
            xpGained: 0,
            streakAtWeekEnd: 0,
            averageCompletionPct: 0,
            liftsData: {},
            assignedWorkouts: 0,
          };
        }
      
        const weekObj = twelveWeekProgram[weekIndex];
        const daysInWeek = weekObj.days || [];
        const assignedWorkouts = daysInWeek.length;
      
        let completedWorkoutsCount = 0;
        let totalWeight = 0;
        let totalSets = 0;
        let totalReps = 0;
        let totalSetsPlanned = 0;
        let totalSetsCompleted = 0;
        let dayCompletionPercents = [];
        let xpFromWeek = 0;
      
        // Store per-exercise data for improved/stagnant logic.
        let liftsData = {};
      
        // Retrieve stored checkbox and XP awarded states.
        const checkboxState = JSON.parse(localStorage.getItem("checkboxState") || "{}");
        const awardedState = JSON.parse(localStorage.getItem("awardedState") || "{}");
      
        daysInWeek.forEach((dayObj, dIndex) => {
          const dayKey = `day_${weekIndex}_${dIndex}`;
          let dayCompleted = !!checkboxState[dayKey];
          if (dayCompleted) {
            completedWorkoutsCount++;
            if (awardedState[dayKey]) {
              // Award day-level XP (+15 XP)
              xpFromWeek += 15;
            }
          }
      
          let daySetsCount = 0;
          let daySetsCompleted = 0;
      
          // Go through warmUp, mainWork, coolDown, or a plain exercises array
          const sections = ["warmUp", "mainWork", "coolDown", "exercises"];
          sections.forEach((sec) => {
            if (Array.isArray(dayObj[sec])) {
              dayObj[sec].forEach((ex) => {
                // Might be a single exercise OR a block with sub-exercises
                if (ex.sets && ex.sets > 0) {
                  // This is a normal sets-based exercise
                  const setsInExercise = ex.sets;
                  daySetsCount += setsInExercise;
      
                  // Initialize liftsData if not present
                  if (!liftsData[ex.name]) {
                    liftsData[ex.name] = {
                      weeklyWeightSum: 0,
                      setsPerformed: 0,
                      finalSetWeight: 0,
                      hasBeenPerformed: false,
                    };
                  }
      
                  // Count how many sets were ticked and sum their weight/reps
                  for (let s = 1; s <= setsInExercise; s++) {
                    const setKey = `set_${weekIndex}_${dIndex}_${ex.name}_${s}`;
                    if (checkboxState[setKey]) {
                      daySetsCompleted++;
                      if (awardedState[setKey]) {
                        xpFromWeek += 3;
                      }
                      const awKey = getSetStorageKey(ex.name, weekNumber, dIndex + 1, s, "actualWeight");
                      const arKey = getSetStorageKey(ex.name, weekNumber, dIndex + 1, s, "actualReps");
      
                      let wVal = localStorage.getItem(awKey);
                      let rVal = localStorage.getItem(arKey);
                      let numericW = wVal ? parseFloat(wVal) : 0;
                      let numericR = rVal ? parseInt(rVal, 10) : 0;
      
                      // Weight * Reps for each set:
                      totalWeight += numericW * numericR;
                      totalReps += numericR;
                      totalSets++;
      
                      liftsData[ex.name].weeklyWeightSum += numericW;
                      liftsData[ex.name].setsPerformed += 1;
                      liftsData[ex.name].hasBeenPerformed = true;
                      if (s === setsInExercise) {
                        liftsData[ex.name].finalSetWeight = numericW;
                      }
                    }
                  }
                }
                else if (ex.exercises && Array.isArray(ex.exercises)) {
                  // This is a block with multiple exercises inside
                  ex.exercises.forEach((subEx) => {
                    if (subEx.sets && subEx.sets > 0) {
                      daySetsCount += subEx.sets;
      
                      if (!liftsData[subEx.name]) {
                        liftsData[subEx.name] = {
                          weeklyWeightSum: 0,
                          setsPerformed: 0,
                          finalSetWeight: 0,
                          hasBeenPerformed: false,
                        };
                      }
      
                      for (let s = 1; s <= subEx.sets; s++) {
                        const setKey = `set_${weekIndex}_${dIndex}_${subEx.name}_${s}`;
                        if (checkboxState[setKey]) {
                          daySetsCompleted++;
                          if (awardedState[setKey]) {
                            xpFromWeek += 3;
                          }
                          const awKey = getSetStorageKey(subEx.name, weekNumber, dIndex + 1, s, "actualWeight");
                          const arKey = getSetStorageKey(subEx.name, weekNumber, dIndex + 1, s, "actualReps");
      
                          let wVal = localStorage.getItem(awKey);
                          let rVal = localStorage.getItem(arKey);
                          let numericW = wVal ? parseFloat(wVal) : 0;
                          let numericR = rVal ? parseInt(rVal, 10) : 0;
      
                          // Weight * Reps for each set:
                          totalWeight += numericW * numericR;
                          totalReps += numericR;
                          totalSets++;
      
                          liftsData[subEx.name].weeklyWeightSum += numericW;
                          liftsData[subEx.name].setsPerformed += 1;
                          liftsData[subEx.name].hasBeenPerformed = true;
                          if (s === subEx.sets) {
                            liftsData[subEx.name].finalSetWeight = numericW;
                          }
                        }
                      }
                    }
                  });
                }
              });
            }
          });
      
          totalSetsPlanned += daySetsCount;
          totalSetsCompleted += daySetsCompleted;
      
          // Calculate day-level completion (0% if daySetsCount > 0 but user ticked none)
          let dayPct = daySetsCount > 0 ? (daySetsCompleted / daySetsCount) * 100 : 0;
          dayCompletionPercents.push(dayPct);
      
          // **Console log** the day’s total sets vs. sets ticked and the percentage
          console.log(
            `[getWeeklyStats] Day ${dIndex + 1} - Planned Sets: ${daySetsCount}, Completed Sets: ${daySetsCompleted}, ` +
            `Completion: ${dayPct.toFixed(2)}%`
          );
        });
      
        let averageCompletionPct = 0;
        if (dayCompletionPercents.length > 0) {
          let sumPct = dayCompletionPercents.reduce((acc, pct) => acc + pct, 0);
          averageCompletionPct = Math.round(sumPct / dayCompletionPercents.length);
        }
      
        console.log(
          `[getWeeklyStats] For week ${weekNumber} - Average Completion Percentage: ${averageCompletionPct}%`
        );
        console.log(
          `[getWeeklyStats] Total Planned Sets: ${totalSetsPlanned}, Total Completed Sets: ${totalSetsCompleted}`
        );
      
        return {
          weekNumber: weekNumber,
          workoutsCompleted: completedWorkoutsCount,
          assignedWorkouts: assignedWorkouts,
          totalWeight: totalWeight,
          totalSets: totalSets,
          totalReps: totalReps,
          xpGained: xpFromWeek,
          streakAtWeekEnd: parseInt(localStorage.getItem("streakCount") || "0", 10),
          averageCompletionPct: averageCompletionPct,
          liftsData: liftsData
        };
      }
      
      function buildWeeklyRecapCards(stats) {
        const recapSubheading = document.getElementById("weeklyRecapSubheading");
        const recapWrapper = document.getElementById("weeklyRecapWrapper");
        const recapCards = document.getElementById("weeklyRecapCards");
        const recapDots = document.getElementById("weeklyRecapDots");
        if (!recapSubheading || !recapWrapper || !recapCards || !recapDots) return;
      
        recapSubheading.style.display = "block";
        recapWrapper.style.display = "block";
      
        // Clear out any previous
        recapCards.innerHTML = "";
        recapDots.innerHTML = "";
      
        // 1) Workouts Completed
        const card1 = document.createElement("div");
        card1.classList.add("recap-card");
        card1.innerHTML = `
          <div class="recap-card-title"><span class="emoji-bg">🔥</span> Workouts Completed</div>
          <div class="recap-card-value">${stats.workoutsCompleted}/${stats.assignedWorkouts}</div>
        `;
        recapCards.appendChild(card1);
      
        const topLiftArr = getTop3Lifts(stats);
        if (topLiftArr.length > 0) {
          // pick the single top
          const topLift = topLiftArr[0]; // highest weight
          const cardTopLift = document.createElement("div");
          cardTopLift.classList.add("recap-card");
          cardTopLift.innerHTML = `
            <div class="recap-card-title"><span class="emoji-bg">🚀</span> Top Lift</div>
            <div class="recap-card-description" style="font-size: 1.3rem;">
               <strong>${topLift.exName}</strong>: ${formatWeight(topLift.weight)}
            </div>
          `;
          // Insert it as the second card
          recapCards.appendChild(cardTopLift);
        }
      
        // 2) Total Weight Lifted
        const card2 = document.createElement("div");
        card2.classList.add("recap-card");
        card2.innerHTML = `
          <div class="recap-card-title"><span class="emoji-bg">🏋️</span> Total Weight Lifted</div>
          <div class="recap-card-value">${formatWeight(stats.totalWeight)}</div>
        `;
        recapCards.appendChild(card2);
      
        // 3) Total Sets Completed
        const card3 = document.createElement("div");
        card3.classList.add("recap-card");
        card3.innerHTML = `
          <div class="recap-card-title"><span class="emoji-bg">📈</span> Total Sets Completed</div>
          <div class="recap-card-value">${stats.totalSets} Sets</div>
        `;
        recapCards.appendChild(card3);
      
        // 4) Total Reps Completed
        const card4 = document.createElement("div");
        card4.classList.add("recap-card");
        card4.innerHTML = `
          <div class="recap-card-title"><span class="emoji-bg">💪</span> Total Reps Completed</div>
          <div class="recap-card-value">${stats.totalReps} Reps</div>
        `;
        recapCards.appendChild(card4);
      
        // 5) *** Top 3 Lifts (NEW) ***
        const top3 = getTop3Lifts(stats); // Call the helper function from above
        // if (top3.length > 0) {
        //   // Build a small list of them, highest to lowest
        //   let topListHTML = "";
        //   top3.forEach(item => {
        //     topListHTML += `<strong>${item.exName}</strong>: ${item.weight} kg<br/>`;
        //   });
      
        //   const card5 = document.createElement("div");
        //   card5.classList.add("recap-card");
        //   card5.innerHTML = `
        //     <div class="recap-card-title"><span class="emoji-bg">🚀</span>Top 3 Lifts</div>
        //     <div class="recap-card-description">
        //       ${topListHTML}
        //     </div>
        //   `;
        //   recapCards.appendChild(card5);
        // }
      }
      
      function pickHighlightIfAny(stats) {
      
        let possible = [];
      
        // 1) XP Gained highlight if xpGained > 500
        if (stats.xpGained > 500) {
          possible.push({ type: "xpGained", label: "🚀 Total XP Gained", value: stats.xpGained + " XP" });
        }
      
        // 2) Streak highlight if streak >= 5
        if (stats.streakAtWeekEnd >= 5) {
          possible.push({ type: "streak", label: "🔥🔥🔥 Active Streak", value: stats.streakAtWeekEnd });
        }
      
        // 3) Average Completion >= 90% highlight
        if (stats.averageCompletionPct >= 90) {
          possible.push({ type: "completionHigh", label: "📊 Average Completion", value: stats.averageCompletionPct + "%" });
        }
      
        if (possible.length === 0) {
          return null;
        }
        // If multiple highlights, pick one at random
        return possible[Math.floor(Math.random() * possible.length)];
      }
      
      function addHighlightCard(highlight) {
        const recapCards = document.getElementById("weeklyRecapCards");
        if (!recapCards) return;
      
        let label = highlight.label || "";
        let val = highlight.value || "";
      
        // Build the highlight card
        const highlightCard = document.createElement("div");
        highlightCard.classList.add("recap-card");
        highlightCard.innerHTML = `
          <div class="recap-card-title">${label}</div>
          <div class="recap-card-value">${val}</div>
        `;
        recapCards.appendChild(highlightCard);
      }
      
      function renderRecapDots() {
        const recapCards = document.getElementById("weeklyRecapCards");
        const recapDots = document.getElementById("weeklyRecapDots");
        if (!recapCards || !recapDots) return;
      
        const cardCount = recapCards.querySelectorAll(".recap-card").length;
        recapDots.innerHTML = "";
      
        for (let i = 0; i < cardCount; i++) {
          const dot = document.createElement("div");
          dot.classList.add("recap-dot");
          if (i === 0) dot.classList.add("active");
          dot.addEventListener("click", () => {
            // Jump the .recap-cards-inner transform to the i-th card
            const cardWidth = recapCards.clientWidth;
            recapCards.style.transform = `translateX(-${i * cardWidth}px)`;
            // Mark this dot as active
            recapDots.querySelectorAll(".recap-dot").forEach(d => d.classList.remove("active"));
            dot.classList.add("active");
          });
          recapDots.appendChild(dot);
        }
      }
      
      function gatherAreasForImprovement(stats) {
        let improvements = [];
      
        // For example, if average completion < 80%, show an improvement card
        if (typeof stats.averageCompletionPct === "number" && stats.averageCompletionPct < 80) {
          improvements.push({
            type: "completionLow",
            label: "⚠️ Low Completion",
            value: stats.averageCompletionPct + "%",
            weekNum: stats.weekNumber
          });
        }
      
        return improvements;
      }
      
      function hideImprovementsSection(showNoImprovementsMsg = false) {
        const heading = document.getElementById("areasImprovementSubheading");
        const wrapper = document.getElementById("areasImprovementWrapper");
        const noMsg = document.getElementById("areasNoImprovementMessage");
        if (heading) heading.style.display = "none";
        if (wrapper) wrapper.style.display = "none";
        if (noMsg) {
          noMsg.style.display = showNoImprovementsMsg ? "block" : "none";
        }
      }
      
      function showImprovementsSection(improvements) {
        const heading = document.getElementById("areasImprovementSubheading");
        const wrapper = document.getElementById("areasImprovementWrapper");
        const cardsInner = document.getElementById("areasImprovementCards");
        const dots = document.getElementById("areasImprovementDots");
        const noMsg = document.getElementById("areasNoImprovementMessage");
      
        if (!heading || !wrapper || !cardsInner || !dots || !noMsg) return;
      
        heading.style.display = "block";
        wrapper.style.display = "block";
        noMsg.style.display = "none";
      
        // Clear out old cards/dots
        cardsInner.innerHTML = "";
        dots.innerHTML = "";
      
        improvements.sort((a, b) => {
          // Define a custom order:
          const order = ["completionLow", "lowestImprovedLift"];
      
          // Get each type’s index in the order array
          const indexA = order.indexOf(a.type);
          const indexB = order.indexOf(b.type);
      
          // If both types are in order array, compare their positions
          if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
          }
          // If only one is in the array, that one should come first
          if (indexA !== -1 && indexB === -1) return -1;
          if (indexA === -1 && indexB !== -1) return 1;
      
          // Otherwise, leave them in place relative to each other
          return 0;
        });
      
        // 2) Now your forEach will iterate in the new order
        improvements.forEach((imp) => {
          const card = document.createElement("div");
          card.classList.add("recap-card", "improvement-card");
      
          // Extract the emoji from imp.label and wrap it
          // For example, if label is "⚠️ Low Completion", let's split on space:
          const [emoji, ...rest] = imp.label.split(" ");
          const wrappedEmoji = `<span class="emoji-bgii">${emoji}</span>`;
          const labelText = rest.join(" "); // "Low Completion"
      
          if (imp.type === "lowestImprovedLift") {
            card.innerHTML = `
              <div class="recap-card-title">
                ${wrappedEmoji} ${labelText}
              </div>
              <div class="recap-card-description">
                Your ${imp.exerciseName} hasn't progressed in ${imp.weeksStagnant || 2} weeks—
                try focusing on form.
                <a href="#" class="recap-link">Click here</a> to watch a tutorial.
              </div>
            `;
          }
          else if (imp.type === "completionLow") {
            card.innerHTML = `
              <div class="recap-card-title">
                ${wrappedEmoji} ${labelText}
              </div>
              <div class="recap-card-description">
                Your average completion for Week ${imp.weekNum} is ${imp.value}.
                Let’s aim for 80% this week!
              </div>
            `;
          }
          else {
            // Fallback for any other improvement type
            card.innerHTML = `
              <div class="recap-card-title">Possible Improvement</div>
              <div class="recap-card-description">
                We noticed an area that can be improved. Keep going!
              </div>
            `;
          }
      
          cardsInner.appendChild(card);
        });
      
        // If only 1 improvement, you might hide the swipe dots
        if (improvements.length === 1) {
          dots.style.display = "none";
        } else {
          // Build swipe dots if multiple improvements
          dots.style.display = "flex";
          for (let i = 0; i < improvements.length; i++) {
            const dot = document.createElement("div");
            dot.classList.add("recap-dot");
            if (i === 0) dot.classList.add("active");
            dot.addEventListener("click", () => {
              const cardWidth = cardsInner.clientWidth;
              cardsInner.style.transform = `translateX(-${i * cardWidth}px)`;
              dots.querySelectorAll(".recap-dot").forEach(d => d.classList.remove("active"));
              dot.classList.add("active");
            });
            dots.appendChild(dot);
          }
        }
      }
      
      function getMostImprovedLiftName(thisWeekNumber) {
        // We need the prior week's data:
        const prevWeekNumber = thisWeekNumber - 1;
        if (prevWeekNumber < 1) {
          // No previous week to compare
          return null;
        }
      
        const prevStats = getWeeklyStats(prevWeekNumber);
        const currStats = getWeeklyStats(thisWeekNumber);
      
        if (!prevStats || !currStats) return null;
      
        const improvements = [];
      
        // Check every exercise in the current week's stats
        for (const exName in currStats.liftsData) {
          const currLift = currStats.liftsData[exName];
          if (!currLift.hasBeenPerformed) continue; // only consider lifts actually performed
      
          // Must also exist in prevStats so we can compare
          const prevLift = prevStats.liftsData[exName];
          if (!prevLift || !prevLift.hasBeenPerformed) continue;
      
          const prevW = prevLift.finalSetWeight || 0;
          const currW = currLift.finalSetWeight || 0;
          if (prevW <= 0 || currW <= 0) continue;
      
          // Calculate % increase from prev to current
          const pctIncrease = ((currW - prevW) / prevW) * 100;
      
          // Determine threshold
          let threshold = 0;
          if (prevW < 50) threshold = 7;
          else if (prevW < 100) threshold = 5;
          else threshold = 3;
      
          // Check if the current lift meets or exceeds that threshold
          if (pctIncrease >= threshold) {
            improvements.push({
              exerciseName: exName,
              pctIncrease
            });
          }
        }
      
        if (improvements.length === 0) {
          return null;
        }
      
        // If multiple lifts qualify, pick one at random
        const randomIndex = Math.floor(Math.random() * improvements.length);
        const chosen = improvements[randomIndex];
        return chosen.exerciseName;
      }
      
      /**
       * getLowestImprovedLiftName
       *  - Checks the last 3 consecutive weeks: [ (thisWeekNumber - 2), (thisWeekNumber - 1), thisWeekNumber ]
       *  - Skips any week in which the user did NOT actually perform that lift (no sets ticked).
       *  - If a lift shows no improvement for at least 2 consecutive intervals, we count it as “stagnant.”
       *  - Among multiple stagnant lifts, pick the one that’s stagnant the longest; if still tied, pick randomly.
       *  - Also saves each week’s weight difference + % difference to localStorage (so you can use it later).
       *  - Returns an object like { exerciseName: "...", weeksStagnant: 2 } or null if none qualifies.
       */
      function getLowestImprovedLiftName(thisWeekNumber) {
        console.log(`[getLowestImprovedLiftName] Checking for stagnant lifts up to week ${thisWeekNumber}...`);
      
        if (thisWeekNumber < 3) {
          console.log("[getLowestImprovedLiftName] Not enough prior weeks to check (need at least 3).");
          return null;
        }
      
        const w1 = thisWeekNumber - 2;
        const w2 = thisWeekNumber - 1;
        const w3 = thisWeekNumber; // "this" week
      
        const statsW1 = getWeeklyStats(w1);
        const statsW2 = getWeeklyStats(w2);
        const statsW3 = getWeeklyStats(w3);
      
        if (!statsW1 || !statsW2 || !statsW3) {
          console.log(`[getLowestImprovedLiftName] Missing data for weeks ${w1}, ${w2}, or ${w3}.`);
          return null;
        }
      
        // We'll store all lifts that were actually performed in each week:
        //   liftsW1 = { exName -> finalSetWeight }
        //   liftsW2 = { exName -> finalSetWeight }
        //   liftsW3 = { exName -> finalSetWeight }
        // If a lift wasn’t performed, it won’t appear.
        const liftsW1 = mapLifts(statsW1);
        const liftsW2 = mapLifts(statsW2);
        const liftsW3 = mapLifts(statsW3);
      
        // We'll gather potential “stagnant” lifts in an array:
        let stagnantCandidates = [];
      
        // For each exercise performed in week 3, see if it was also performed in weeks 2 and 1:
        for (let exName in liftsW3) {
          const w3Weight = liftsW3[exName];
      
          if (liftsW2[exName] == null) {
            // Not performed in week2 => skip (can't be “2 consecutive intervals” if a week was skipped).
            continue;
          }
          const w2Weight = liftsW2[exName];
      
          if (w2Weight < 1 || w3Weight < 1) {
            // If there's basically no real data, skip
            continue;
          }
      
          // Save the difference from week2 -> week3
          const w2toW3_diff = w3Weight - w2Weight;
          const w2toW3_pct = w2Weight > 0 ? (w2toW3_diff / w2Weight) * 100 : 0;
      
          // Also store these differences in localStorage for reference, if you like:
          const diffKey = `${exName}__week${w2}_to_week${w3}_weightDiff`;
          const pctKey = `${exName}__week${w2}_to_week${w3}_weightPctDiff`;
          localStorage.setItem(diffKey, w2toW3_diff.toFixed(2));
          localStorage.setItem(pctKey, w2toW3_pct.toFixed(2));
      
          console.log(`[getLowestImprovedLiftName] => ${exName}, from week${w2} to week${w3}: diff=${w2toW3_diff}, pct=${w2toW3_pct.toFixed(1)}% (saved to localStorage)`);
      
          // If there's no improvement this interval:
          const noImprovementFromW2toW3 = (w3Weight <= w2Weight);
      
          // Now check the prior interval: week1 -> week2
          if (liftsW1[exName] == null) {
            // Skipped in week1 => can’t count this as 2 intervals in a row
            continue;
          }
          const w1Weight = liftsW1[exName];
          if (w1Weight < 1) continue;
      
          const w1toW2_diff = w2Weight - w1Weight;
          const w1toW2_pct = w1Weight > 0 ? (w1toW2_diff / w1Weight) * 100 : 0;
      
          // Also store that difference:
          const diffKey2 = `${exName}__week${w1}_to_week${w2}_weightDiff`;
          const pctKey2 = `${exName}__week${w1}_to_week${w2}_weightPctDiff`;
          localStorage.setItem(diffKey2, w1toW2_diff.toFixed(2));
          localStorage.setItem(pctKey2, w1toW2_pct.toFixed(2));
      
          console.log(`[getLowestImprovedLiftName] => ${exName}, from week${w1} to week${w2}: diff=${w1toW2_diff}, pct=${w1toW2_pct.toFixed(1)}% (saved to localStorage)`);
      
          const noImprovementFromW1toW2 = (w2Weight <= w1Weight);
      
          // If we have 2 consecutive intervals of no improvement:
          if (noImprovementFromW1toW2 && noImprovementFromW2toW3) {
            // That means at least 2+ weeks of stagnation
            console.log(`[getLowestImprovedLiftName] => ${exName} is STAGNANT in weeks [${w1},${w2},${w3}]!`);
            // We can call this "weeksStagnant=2"
            stagnantCandidates.push({
              exerciseName: exName,
              weeksStagnant: 2
            });
          }
        }
      
        if (stagnantCandidates.length === 0) {
          console.log("[getLowestImprovedLiftName] => No multi-week stagnation found.");
          return null;
        }
      
        // If multiple, pick the one that’s “longest stagnant.” If they’re all 2, we pick randomly:
        // (In the future if you want 3+ weeks of stagnation, you could store weeksStagnant=3, etc.)
        const maxStagnant = Math.max(...stagnantCandidates.map(c => c.weeksStagnant));
        const topCandidates = stagnantCandidates.filter(c => c.weeksStagnant === maxStagnant);
      
        const finalPick = topCandidates[Math.floor(Math.random() * topCandidates.length)];
        console.log(`[getLowestImprovedLiftName] => Returning stagnant lift: ${finalPick.exerciseName}, weeksStagnant=${finalPick.weeksStagnant}`);
        return finalPick;
      }
      
      /** Helper that extracts a { exName: finalSetWeight } map from the weeklyStats' liftsData. */
      function mapLifts(statsObj) {
        let out = {};
        if (!statsObj || !statsObj.liftsData) return out;
        for (let exName in statsObj.liftsData) {
          let rec = statsObj.liftsData[exName];
          if (rec.hasBeenPerformed && rec.finalSetWeight > 0) {
            out[exName] = rec.finalSetWeight;
          }
        }
        return out;
      }
      
      function initSwipeableCards(containerId, cardsInnerId, dotsId) {
        const containerEl = document.getElementById(containerId);
        const cardsInnerEl = document.getElementById(cardsInnerId);
        const dotsEl = document.getElementById(dotsId);
        if (!containerEl || !cardsInnerEl || !dotsEl) return;
      
        let startX = 0, isSwiping = false, currentIndex = 0;
        const cardCount = cardsInnerEl.querySelectorAll(".recap-card").length;
      
        function showCardAtIndex(idx) {
          if (idx < 0) idx = cardCount - 1;
          if (idx >= cardCount) idx = 0;
          currentIndex = idx;
          const cardWidth = containerEl.clientWidth;
          cardsInnerEl.style.transform = `translateX(-${idx * cardWidth}px)`;
          updateDots();
        }
        function updateDots() {
          dotsEl.querySelectorAll(".recap-dot").forEach(dot => dot.classList.remove("active"));
          const arr = dotsEl.querySelectorAll(".recap-dot");
          if (arr[currentIndex]) {
            arr[currentIndex].classList.add("active");
          }
        }
      
        containerEl.addEventListener("touchstart", e => {
          if (e.touches?.length) {
            startX = e.touches[0].clientX;
            isSwiping = true;
          }
        });
        containerEl.addEventListener("touchend", e => {
          if (!isSwiping) return;
          const endX = e.changedTouches[0].clientX;
          const diff = endX - startX;
          if (diff < -40) showCardAtIndex(currentIndex + 1);
          else if (diff > 40) showCardAtIndex(currentIndex - 1);
          isSwiping = false;
        });
      
        // Build dot elements if needed:
        dotsEl.innerHTML = "";
        for (let i = 0; i < cardCount; i++) {
          const dot = document.createElement("div");
          dot.classList.add("recap-dot");
          if (i === 0) dot.classList.add("active");
          dot.addEventListener("click", () => showCardAtIndex(i));
          dotsEl.appendChild(dot);
        }
      
        // Show the first card by default
        showCardAtIndex(0);
      }
      
      function getLockedWeeklyRecap(weekNumber) {
        const storageKey = `weeklyRecapData_week${weekNumber}`;
        let storedData = localStorage.getItem(storageKey);
        if (storedData) {
          try {
            console.log(`[getLockedWeeklyRecap] Using locked data for Week ${weekNumber}`);
            return JSON.parse(storedData);
          } catch (e) {
            console.warn("[getLockedWeeklyRecap] Error parsing locked data; recalculating...");
          }
        }
        // If no locked data exists, compute and save it.
        const stats = getWeeklyStats(weekNumber);
        localStorage.setItem(storageKey, JSON.stringify(stats));
        console.log(`[getLockedWeeklyRecap] Locked data generated for Week ${weekNumber}`);
        return stats;
      }
      
      /*******************************************
       *  WEEKLY TOTALS CALCULATION (REVISED)
       *******************************************/
      function updateWeeklyTotals() {
        console.log("[updateWeeklyTotals] Recalculating weekly totals...");
      
        const program = JSON.parse(localStorage.getItem("twelveWeekProgram") || "[]");
        if (!Array.isArray(program) || program.length === 0) return;
      
        const checkboxState = JSON.parse(localStorage.getItem("checkboxState") || "{}");
      
        // ❶ READ THE USER’S “workoutDays” (the assigned workouts-per-week)
        const assignedWorkoutsPerWeek = parseInt(localStorage.getItem("workoutDays") || "0", 10);
      
        program.forEach((weekObj, wIndex) => {
          const wNum = weekObj.week;
          let totalWeight = 0;
          let totalReps = 0;
          let totalSetsDone = 0;
          let completedWorkoutsCount = 0;
      
          if (Array.isArray(weekObj.days)) {
            weekObj.days.forEach((dayObj, dIndex) => {
              const dayKey = `day_${wIndex}_${dIndex}`;
              if (checkboxState[dayKey]) {
                completedWorkoutsCount++;
              }
              ["warmUp", "mainWork", "coolDown", "exercises"].forEach(section => {
                if (Array.isArray(dayObj[section])) {
                  dayObj[section].forEach(item => {
                    // Single-exercise vs. block logic
                    if (item.sets && item.sets > 0) {
                      for (let s = 1; s <= item.sets; s++) {
                        const setKey = `set_${wIndex}_${dIndex}_${item.name}_${s}`;
                        if (checkboxState[setKey]) {
                          totalSetsDone++;
                        }
                        const awKey = getSetStorageKey(item.name, wNum, dIndex + 1, s, "actualWeight");
                        const arKey = getSetStorageKey(item.name, wNum, dIndex + 1, s, "actualReps");
                        totalWeight += parseFloat(localStorage.getItem(awKey) || "0");
                        totalReps += parseInt(localStorage.getItem(arKey) || "0", 10);
                      }
                    }
                    else if (item.exercises && Array.isArray(item.exercises)) {
                      item.exercises.forEach(ex => {
                        if (ex.sets && ex.sets > 0) {
                          for (let s = 1; s <= ex.sets; s++) {
                            const setKey = `set_${wIndex}_${dIndex}_${ex.name}_${s}`;
                            if (checkboxState[setKey]) {
                              totalSetsDone++;
                            }
                            const awKey = getSetStorageKey(ex.name, wNum, dIndex + 1, s, "actualWeight");
                            const arKey = getSetStorageKey(ex.name, wNum, dIndex + 1, s, "actualReps");
                            totalWeight += parseFloat(localStorage.getItem(awKey) || "0");
                            totalReps += parseInt(localStorage.getItem(arKey) || "0", 10);
                          }
                        }
                      });
                    }
                  });
                }
              });
            });
          }
      
          // ❷ STORE THE AGGREGATES FOR *THIS* WEEK
          localStorage.setItem(`week${wNum}_totalWeight`, totalWeight.toString());
          localStorage.setItem(`week${wNum}_totalReps`, totalReps.toString());
          localStorage.setItem(`week${wNum}_totalSets`, totalSetsDone.toString());
          localStorage.setItem(`week${wNum}_workoutsDone`, completedWorkoutsCount.toString());
          console.log(`[updateWeeklyTotals] Week ${wNum} - Workouts Done: ${completedWorkoutsCount} (Assigned: ${assignedWorkoutsPerWeek})`);
      
      
          // ❸ Also store how many workouts were assigned (e.g. 4 or 5) for that week
          localStorage.setItem(`week${wNum}_workoutsAssigned`, assignedWorkoutsPerWeek.toString());
      
          console.log(`[updateWeeklyTotals] Week ${wNum}: Weight=${totalWeight}, Reps=${totalReps}, Sets=${totalSetsDone}, Done=${completedWorkoutsCount}/${assignedWorkoutsPerWeek}`);
        });
        // checkAndResetWorkoutStreak(); TODO
        console.log("[updateWeeklyTotals] Completed update and streak check.");
      }
      
      function getTop3Lifts(stats) {
        const results = [];
      
        // For each exercise in stats.liftsData, finalSetWeight is the heaviest set user did that week
        for (const exName in stats.liftsData) {
          const record = stats.liftsData[exName];
          if (record.hasBeenPerformed && record.finalSetWeight > 0) {
            results.push({
              exName: exName,
              weight: record.finalSetWeight
            });
          }
        }
      
        // Sort descending by .weight
        results.sort((a, b) => b.weight - a.weight);
      
        // Return the top 3 (or fewer if user only performed 1-2 lifts)
        return results.slice(0, 3);
      }
      
      /***********************************************************************
       * SECTION 88 - STRENGTH & WORKOUT TRENDS
       * 
       *  1) Show/hide the entire section only if user has purchased AWT
       *  2) Build flatten list of unique exercises w/ assigned phase
       *  3) Advanced dropdown + search
       *  4) Three charts (line, stacked bar, heatmap)
       *  5) Coach Insights
       ***********************************************************************/
      
      // (A) We'll show this section only if hasPurchasedAWT
      window.addEventListener("load", () => {
        if (hasPurchasedAWT) {
          document.getElementById("strengthWorkoutTrendsHeading").style.display = "block";
          document.getElementById("strengthWorkoutTrendsSection").style.display = "block";
          initStrengthWorkoutTrendsSection();
        }
      });
      
      // -----------------------------------------------------
      // (B) Flatten the 12-week program => unique exercises
      //     Each exercise => { name, muscleGroup, isTechnical, etc. phase:1/2/3 }
      // -----------------------------------------------------
      function buildFlattenedExerciseList() {
        let uniqueMap = {};
      
        for (let w = 0; w < twelveWeekProgram.length; w++) {
          const weekObj = twelveWeekProgram[w];
          const weekNumber = weekObj.week;
          const phaseNumber = getPhaseFromWeek(weekNumber);
      
          // Only parse `weekObj.days[].mainWork`:
          weekObj.days.forEach(dayObj => {
            // dayObj.mainWork is an array of blocks
            if (!Array.isArray(dayObj.mainWork)) return;
      
            dayObj.mainWork.forEach(block => {
              // Must have blockType === "Resistance Training"
              if (block.blockType !== "Resistance Training") {
                return; // skip it
              }
              // Now block.exercises is the array of actual exercises
              if (Array.isArray(block.exercises)) {
                block.exercises.forEach(ex => {
                  let lowerName = (ex.name || "").toLowerCase().trim();
                  if (!lowerName) return;
      
                  if (!uniqueMap[lowerName]) {
                    // store first phase found
                    uniqueMap[lowerName] = {
                      ...ex,
                      phase: phaseNumber
                    };
                  }
                });
              }
            });
          });
        }
      
        // Convert to array and sort by phase, then name:
        let finalList = Object.values(uniqueMap);
        finalList.sort((a, b) => {
          if (a.phase !== b.phase) return a.phase - b.phase;
          return a.name.localeCompare(b.name);
        });
        return finalList;
      }
      
      // We'll build the list once on load
      let flattenedExercises = [];
      
      // -----------------------------------------------------
      // (C) "initStrengthWorkoutTrendsSection" 
      //     - Called once on load if user has AWT
      //     - Sets up the dropdown & event listeners
      // -----------------------------------------------------
      function initStrengthWorkoutTrendsSection() {
        flattenedExercises = buildFlattenedExerciseList();
      
        // Re-check if we have any exercises at all
        if (flattenedExercises.length === 0) {
          // Edge case: no data
          const heading = document.getElementById("strengthWorkoutTrendsHeading");
          if (heading) heading.textContent = "No Exercises Found";
          return;
        }
      
        // 1) Read the lastSelectedExercise from localStorage, fallback to the first in the list
        let storedName = localStorage.getItem("strengthTrendsSelectedExercise") || "";
        let defaultEx = flattenedExercises[0];
        if (storedName) {
          // see if it’s in the list
          let found = flattenedExercises.find(e => e.name.toLowerCase() === storedName.toLowerCase());
          if (found) {
            defaultEx = found;
          }
        }
      
        // 2) Render the dropdown
        buildAdvancedDropdown(flattenedExercises);
      
        // 3) Set the displayed subheading
        const selNameEl = document.getElementById("selectedExerciseName");
        selNameEl.textContent = defaultEx.name;
      
        // 4) Generate the 3 charts
        buildTrendChartsFor(defaultEx.name);
      
        // 5) Generate Coach Insights
        buildCoachInsightsFor(defaultEx.name);
      
        // 6) Hook up the subheading + chevron to toggle the dropdown
        const chevron = document.getElementById("exerciseDropdownChevron");
        const container = document.getElementById("exerciseDropdownContainer");
        const header = document.querySelector(".exercise-analysis-header");
      
        function openDropdown() {
          container.classList.remove("hidden");
          chevron.style.transform = "rotate(180deg)";
        }
        function closeDropdown() {
          container.classList.add("hidden");
          chevron.style.transform = "rotate(0deg)";
        }
      
        header.addEventListener("click", (e) => {
          // Toggle on header click
          if (container.classList.contains("hidden")) {
            openDropdown();
          } else {
            closeDropdown();
          }
        });
        document.addEventListener("click", (e) => {
          // If the container is open, and the click is NOT inside container or header => close
          if (!container.classList.contains("hidden")) {
            if (!container.contains(e.target) && !header.contains(e.target)) {
              closeDropdown();
            }
          }
        });
      }
      
      // -----------------------------------------------------
      // (D) Build the advanced dropdown with search
      // -----------------------------------------------------
      function buildAdvancedDropdown(exArray) {
        const listEl = document.getElementById("analysisExerciseList");
        const searchInput = document.getElementById("analysisSearchInput");
      
        // We'll keep a separate "master" array, and a "filtered" array as user types
        let masterList = exArray.map(e => ({
          name: e.name,
          muscleGroup: e.muscleGroup || "",
          phase: e.phase,  // numeric 1,2,3
        }));
      
        function renderList(filterTerm = "") {
          listEl.innerHTML = "";
          filterTerm = filterTerm.trim().toLowerCase();
      
          // Step 1) Filter
          let filtered = masterList.filter(item => {
            // 3 fields: name, muscleGroup, "Phase 1"/"Phase 2"/"Phase 3"
            // plus user might type just "1", "2", or "3"
            const nameMatch = item.name.toLowerCase().includes(filterTerm);
            const muscleMatch = item.muscleGroup.toLowerCase().includes(filterTerm);
      
            // Check phase text
            const phaseText = `phase ${item.phase}`; // e.g. "phase 1"
            const actualPhaseName = (item.phase === 1) ? "foundational"
              : (item.phase === 2) ? "hypertrophy"
                : "strength";
            const combinedPhase = `phase ${item.phase} ${actualPhaseName.toLowerCase()}`;
            const phaseMatch = phaseText.includes(filterTerm) || actualPhaseName.toLowerCase().includes(filterTerm) || combinedPhase.includes(filterTerm);
      
            return (nameMatch || muscleMatch || phaseMatch);
          });
      
          if (filtered.length === 0) {
            listEl.innerHTML = `<div class="analysis-no-match">No exercise found</div>`;
            return;
          }
      
          // Step 2) Group by phase => { 1: [...], 2: [...], 3: [...] }
          let grouped = { 1: [], 2: [], 3: [] };
          filtered.forEach(f => grouped[f.phase].push(f));
      
          // Step 3) Sort each group alphabetically by name
          for (let p = 1; p <= 3; p++) {
            grouped[p].sort((a, b) => a.name.localeCompare(b.name));
          }
      
          // Step 4) Render each group with a heading
          for (let p = 1; p <= 3; p++) {
            if (grouped[p].length > 0) {
              // heading
              let headingText = (p === 1) ? "--- Phase 1 ---"
                : (p === 2) ? "--- Phase 2 ---"
                  : "--- Phase 3 ---";
              const hEl = document.createElement("div");
              hEl.classList.add("analysis-phase-header");
              hEl.textContent = headingText;
              listEl.appendChild(hEl);
      
              // items
              grouped[p].forEach(item => {
                const iEl = document.createElement("div");
                iEl.classList.add("analysis-exercise-item");
                iEl.textContent = item.name;
                iEl.addEventListener("click", () => onSelectExercise(item));
                listEl.appendChild(iEl);
              });
            }
          }
        }
      
        function onSelectExercise(item) {
          // Hide dropdown
          document.getElementById("exerciseDropdownContainer").classList.add("hidden");
          document.getElementById("exerciseDropdownChevron").style.transform = "rotate(0deg)";
      
          // Update subheading
          const selNameEl = document.getElementById("selectedExerciseName");
          selNameEl.textContent = item.name;
      
          // Save in localStorage
          localStorage.setItem("strengthTrendsSelectedExercise", item.name);
      
          // Re-draw charts
          buildTrendChartsFor(item.name);
      
          // Re-draw coach insights
          buildCoachInsightsFor(item.name);
        }
      
        // init
        renderList();
      
        // search on input
        searchInput.addEventListener("input", () => {
          renderList(searchInput.value);
        });
      }
      
      // -----------------------------------------------------
      // (E) Build the 3 charts for the selected exercise
      // -----------------------------------------------------
      function buildTrendChartsFor(exerciseName) {
        let dataVolume = gatherVolumeData(exerciseName);
        let dataRepsSets = gatherRepsSetsData(exerciseName);
      
        renderVolumeLineChart(dataVolume);
        renderRepsSetsChart(dataRepsSets);
      
        // Pass just { exerciseName } into the heatmap:
        renderConsistencyHeatmap({ exerciseName: exerciseName });
      
        // Now do your swipeable logic, etc.
        initSwipeableCards("strengthTrendsWrapper", "strengthTrendsCards", "strengthTrendsDots");
      }
      
      // (E1) gatherVolumeData -> returns array of objects representing each session
      function gatherVolumeData(exerciseName) {
        // We want to find all sessions across the 12 weeks where this exercise is present.
        // Then sum actualWeight*actualReps per set => totalVolume for that session.
        // Return an array sorted by week/day
        let result = [];
        const checkboxState = JSON.parse(localStorage.getItem("checkboxState") || "{}");
      
        for (let w = 0; w < twelveWeekProgram.length; w++) {
          const weekNumber = twelveWeekProgram[w].week;
          const daysArr = twelveWeekProgram[w].days || [];
          for (let d = 0; d < daysArr.length; d++) {
            if (!isExerciseInDay(daysArr[d], exerciseName)) continue;
            // Summation:
            let totalVol = 0;
            const setsCount = getSetsCountInDay(daysArr[d], exerciseName);
            for (let s = 1; s <= setsCount; s++) {
              const awKey = getSetStorageKey(exerciseName, weekNumber, d + 1, s, "actualWeight");
              const arKey = getSetStorageKey(exerciseName, weekNumber, d + 1, s, "actualReps");
              let wVal = parseFloat(localStorage.getItem(awKey) || "0");
              let rVal = parseInt(localStorage.getItem(arKey) || "0", 10);
              totalVol += (wVal * rVal);
            }
            if (totalVol > 0) {
              result.push({
                sessionLabel: `W${weekNumber} D${d + 1}`,
                totalVolume: totalVol
              });
            }
          }
        }
      
        return result;
      }
      
      // (E2) gatherRepsSetsData -> for stacked bar
      function gatherRepsSetsData(exerciseName) {
        let result = [];
        for (let w = 0; w < twelveWeekProgram.length; w++) {
          const weekNumber = twelveWeekProgram[w].week;
          const daysArr = twelveWeekProgram[w].days || [];
          for (let d = 0; d < daysArr.length; d++) {
            const setsCount = getSetsCountInDay(daysArr[d], exerciseName);
            if (setsCount <= 0) continue;
      
            let setsPerformed = [];
            for (let s = 1; s <= setsCount; s++) {
              const arKey = getSetStorageKey(exerciseName, weekNumber, d + 1, s, "actualReps");
              let rVal = parseInt(localStorage.getItem(arKey) || "0", 10);
              if (rVal < 0) rVal = 0;
              setsPerformed.push(rVal);
            }
            // only push if there's at least one set
            if (setsPerformed.some(x => x > 0)) {
              result.push({
                sessionLabel: `W${weekNumber} D${d + 1}`,
                setsArray: setsPerformed
              });
            }
          }
        }
        return result;
      }
      
      // (E3) gatherConsistencyData -> for the heatmap
      function gatherConsistencyData(exerciseName) {
        // We break it into 3 phases:
        //   => For each phase, we see which weeks belong (1-4 => P1, 5-8 => P2, 9-12 => P3).
        //   => For each week, see which days the exercise is scheduled.
        //   => Check how many sets were logged vs total sets.
        // We'll mark each scheduled day as green/yellow/red.
        let phases = { 1: [], 2: [], 3: [] };
        // phases[1] => array of {week:1..4, days: [ {dayNum, color} ]}
      
        for (let w = 0; w < twelveWeekProgram.length; w++) {
          const weekNumber = twelveWeekProgram[w].week;
          const ph = getPhaseFromWeek(weekNumber);
          const daysArr = twelveWeekProgram[w].days || [];
          let daysData = [];
          for (let d = 0; d < daysArr.length; d++) {
            const setsCount = getSetsCountInDay(daysArr[d], exerciseName);
            if (setsCount === 0) continue;  // exercise not scheduled
            // Count how many are actually logged
            let setsLogged = 0;
            for (let s = 1; s <= setsCount; s++) {
              const setKey = `set_${w}_${d}_${exerciseName}_${s}`;
              if (loadCheckboxState(setKey)) {
                setsLogged++;
              }
            }
            // color logic
            let color = "red"; // default if no sets logged
            if (setsLogged > 0 && setsLogged < setsCount) {
              color = "yellow";
            } else if (setsLogged === setsCount) {
              color = "green";
            }
            daysData.push({
              dayNum: d + 1,
              color: color
            });
          }
          phases[ph].push({
            week: weekNumber,
            days: daysData
          });
        }
        return phases;
      }
      
      function isExerciseInDay(dayObj, exerciseName) {
        let found = false;
        ["warmUp", "mainWork", "coolDown", "exercises"].forEach(section => {
          if (Array.isArray(dayObj[section])) {
            dayObj[section].forEach(ex => {
              if (ex.exercises && Array.isArray(ex.exercises)) {
                ex.exercises.forEach(sub => {
                  if (sub.name === exerciseName) found = true;
                });
              } else {
                if (ex.name === exerciseName) found = true;
              }
            });
          }
        });
        return found;
      }
      
      function getSetsCountInDay(dayObj, exerciseName) {
        // return total sets for that exercise
        let totalSets = 0;
        ["warmUp", "mainWork", "coolDown", "exercises"].forEach(section => {
          if (!dayObj[section]) return;
          dayObj[section].forEach(ex => {
            if (ex.exercises && Array.isArray(ex.exercises)) {
              ex.exercises.forEach(sub => {
                if (sub.name === exerciseName) {
                  totalSets += (sub.sets || 0);
                }
              });
            } else {
              if (ex.name === exerciseName) {
                totalSets += (ex.sets || 0);
              }
            }
          });
        });
        return totalSets;
      }
      
      // -----------------------------------------------------
      // (F) Rendering the charts
      //     For a simple approach, we’ll assume you have Chart.js or do minimal "vanilla" draws
      //     (Below is an example with minimal Chart.js usage. 
      //      If you *cannot* load external libs, you'll do custom canvas draws.)
      // -----------------------------------------------------
      let volumeChartInstance = null;
      let repsSetsChartInstance = null;
      
      // (F1) Volume line chart
      function renderVolumeLineChart(dataArray) {
        // dataArray => [ {sessionLabel, totalVolume}, ...]
        const ctx = document.getElementById("chartTotalVolume").getContext("2d");
        // Destroy old instance if exists
        if (volumeChartInstance) {
          volumeChartInstance.destroy();
        }
        if (dataArray.length === 0) {
          // If no data, create a blank or small placeholder
          volumeChartInstance = new Chart(ctx, {
            type: "line",
            data: {
              labels: [],
              datasets: [{
                label: "No Data",
                data: []
              }]
            }
          });
          return;
        }
        const labels = dataArray.map(x => x.sessionLabel);
        const volumes = dataArray.map(x =>
          getPreferredWeightUnit() === "lbs" ? kgToLbs(x.totalVolume) : x.totalVolume
        );
        volumeChartInstance = new Chart(ctx, {
          type: "line",
          data: {
            labels: labels,
            datasets: [
              {
                label: `Total Volume (${getPreferredWeightUnit()})`,
                data: volumes,
                fill: false,
                tension: 0,
                pointRadius: 5
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              tooltip: {
                callbacks: {
                  label: function (context) {
                    let val = context.parsed.y || 0;
                    return "Total: " + formatWeight(val);
                  }
                }
              }
            },
            scales: {
              y: {
                title: {
                  display: true,
                  text: `Volume (${getPreferredWeightUnit()})`
                }
              },
              x: {
                title: {
                  display: true,
                  text: "Session"
                }
              }
            }
          }
        });
      }
      
      // (F2) Reps & Sets stacked bar
      function renderRepsSetsChart(dataArray) {
        const ctx = document.getElementById("chartRepsSets").getContext("2d");
        if (repsSetsChartInstance) {
          repsSetsChartInstance.destroy();
        }
      
        if (dataArray.length === 0) {
          // Show an empty dataset so user sees axis, title, etc.
          repsSetsChartInstance = new Chart(ctx, {
            type: "bar",
            data: {
              labels: ["No Sessions"],
              datasets: [
                {
                  label: "Set 1",
                  data: [0],
                  backgroundColor: "#cccccc"
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: {
                  title: { display: true, text: "Session" }
                },
                y: {
                  title: { display: true, text: "Reps" }
                }
              },
              plugins: {
                tooltip: {
                  enabled: false // or show a minimal tooltip if you want
                }
              }
            }
          });
          return;
        }
      
        // We need a stacked approach: each set is a dataset
        // But dataArray might vary in how many sets (some sessions might have 3 sets, others 4, etc.)
        // Let’s find the maximum # of sets
        let maxSets = 0;
        dataArray.forEach(item => {
          if (item.setsArray.length > maxSets) {
            maxSets = item.setsArray.length;
          }
        });
        let labels = dataArray.map(x => x.sessionLabel);
      
        // We'll build maxSets datasets
        let datasets = [];
        for (let s = 0; s < maxSets; s++) {
          // each set => e.g. "Set #1", "Set #2"
          let dataPoints = dataArray.map(sess => {
            // if that session doesn't have a setsArray[s], use 0
            return sess.setsArray[s] || 0;
          });
          datasets.push({
            label: `Set ${s + 1}`,
            data: dataPoints
          });
        }
      
        repsSetsChartInstance = new Chart(ctx, {
          type: "bar",
          data: {
            labels: labels,
            datasets: datasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              tooltip: {
                callbacks: {
                  label: function (context) {
                    return `${context.dataset.label}: ${context.parsed.y} reps`;
                  },
                  footer: function (tooltipItems) {
                    // Show total sets, e.g. “Session: 4 sets (12,12,10,10)”
                    if (tooltipItems.length > 0) {
                      const idx = tooltipItems[0].dataIndex;
                      const setsForSession = dataArray[idx].setsArray;
                      const count = setsForSession.length;
                      const repStr = setsForSession.join(", ");
                      return `Session: ${count} sets (${repStr})`;
                    }
                    return "";
                  }
                }
              }
            },
            scales: {
              x: {
                stacked: true,
                title: {
                  display: true,
                  text: "Session"
                }
              },
              y: {
                stacked: true,
                title: {
                  display: true,
                  text: "Reps"
                }
              }
            }
          }
        });
      }
      
      // (F3) Consistency Heatmap 
      function renderConsistencyHeatmap(dataObj) {
        // 1) Clear out the original container
        const container = document.getElementById("heatmapContainer");
        container.innerHTML = "";
      
        // 2) Remove any previously-created "extra" heatmap card from a prior call
        const existingExtra = document.getElementById("extraHeatmapCard");
        if (existingExtra) {
          existingExtra.remove();
        }
      
        // Gather your sessions as before
        const exerciseName = dataObj.exerciseName;
        const activeWeek = parseInt(localStorage.getItem("activeWorkoutWeek") || "1", 10);
      
        let allSessions = [];
        for (let w = 1; w <= 12; w++) {
          const weekData = twelveWeekProgram.find(weekObj => weekObj.week === w);
          if (!weekData) continue;
      
          for (let d = 1; d <= 7; d++) {
            if (d - 1 >= weekData.days.length) break;
            const setsCount = getSetsCountInDay(weekData.days[d - 1], exerciseName);
            if (setsCount > 0) {
              let completed = 0;
              for (let s = 1; s <= setsCount; s++) {
                const setKey = `set_${w - 1}_${d - 1}_${exerciseName}_${s}`;
                if (loadCheckboxState(setKey)) {
                  completed++;
                }
              }
      
              // Determine color
              let color = "gray";
              if (completed === setsCount) {
                // fully completed
                if (w === activeWeek) {
                  color = "green";
                  localStorage.setItem(`heatmapGreen_${exerciseName}_week${w}_day${d}`, "true");
                } else if (w < activeWeek) {
                  if (localStorage.getItem(`heatmapGreen_${exerciseName}_week${w}_day${d}`) === "true") {
                    color = "green";
                  } else {
                    color = "blue";
                  }
                }
              } else if (completed > 0) {
                color = "yellow";
              } else if (w < activeWeek) {
                color = "red";
              }
              allSessions.push({
                label: `W${w} D${d}`,
                color: color
              });
            }
          }
        }
      
        // Helper: chunk an array of session objects into rows of 4, 
        // and append them to a given container (the .heatmap-container).
        function appendRowsOf4(sessions, containerEl) {
          const rowSize = 4;
          for (let i = 0; i < sessions.length; i += rowSize) {
            const rowItems = sessions.slice(i, i + rowSize);
      
            const rowDiv = document.createElement("div");
            rowDiv.style.display = "flex";
            rowDiv.style.gap = "8px";
            rowDiv.style.marginBottom = "8px";
      
            rowItems.forEach(item => {
              const cell = document.createElement("div");
              cell.classList.add("heatmap-cell");
              cell.textContent = item.label;
      
              switch (item.color) {
                case "green":
                  cell.classList.add("green");
                  break;
                case "blue":
                  cell.classList.add("blue");
                  break;
                case "yellow":
                  cell.style.backgroundColor = "#ffc107";
                  cell.style.color = "#000";
                  break;
                case "red":
                  cell.classList.add("red");
                  break;
                default:
                  cell.style.backgroundColor = "#ccc";
                  cell.style.color = "#000";
              }
      
              rowDiv.appendChild(cell);
            });
            containerEl.appendChild(rowDiv);
          }
        }
      
        // 3) Display the first 16 cells in the original container
        const firstChunk = allSessions.slice(0, 16);
        appendRowsOf4(firstChunk, container);
      
        // 4) If there are more than 16 cells, create ONE extra card for the remainder
        if (allSessions.length > 16) {
          const secondChunk = allSessions.slice(16);
      
          const extraCard = document.createElement("div");
          extraCard.classList.add("recap-card", "trend-card");
          extraCard.id = "extraHeatmapCard";
      
          const titleEl = document.createElement("div");
          titleEl.classList.add("recap-card-title");
          titleEl.textContent = "Consistency Heatmap";
          extraCard.appendChild(titleEl);
      
          const extraContainer = document.createElement("div");
          extraContainer.classList.add("heatmap-container");
          extraContainer.id = "extraHeatmapContainer";
          extraCard.appendChild(extraContainer);
      
          // Append the second chunk of rows to that new container
          appendRowsOf4(secondChunk, extraContainer);
      
          // Finally, insert this extra card into the .trend-cards slider
          // so it appears as an additional swipe card
          const trendsCards = document.getElementById("strengthTrendsCards");
          trendsCards.appendChild(extraCard);
        }
      }
      
      // -----------------------------------------------------
      // (G) Coach Insights
      // -----------------------------------------------------
      function buildCoachInsightsFor(exerciseName) {
        const heading = document.getElementById("coachInsightsHeading");
        const container = document.getElementById("coachInsightsContainer");
        const msgEl = document.getElementById("coachInsightsMessage");
        if (!heading || !container || !msgEl) return;
      
        // Reset 
        heading.style.display = "none";
        container.style.display = "none";
        msgEl.textContent = "";
      
        // 1) Determine the user's "current" training week
        //    In practice, we can read activeWorkoutWeek or currentWeekIndex, whichever you prefer.
        let activeW = parseInt(localStorage.getItem("activeWorkoutWeek") || "1", 10);
        if (activeW < 1) activeW = 1;
      
        // If activeW > purchasedWeeks, clamp
        if (activeW > purchasedWeeks) {
          activeW = purchasedWeeks;
        }
      
        // 2) If it’s week 1 => show "just getting started..."
        if (activeW === 1) {
          heading.style.display = "block";
          container.style.display = "block";
          msgEl.textContent = "You're just getting started — coach insights will appear once there's more data to analyze.";
          return;
        }
      
        // 3) Check if the current week is deload
        if (isDeloadWeek(activeW)) {
          // If no prior training week to compare, show “You’re in a deload week...”
          // We also skip the coach insights if 2+ sessions don't exist outside the deload.
          // We'll do a quick check if there's *any* valid training week < activeW that isn't deload
          let anyValid = false;
          for (let w = 1; w < activeW; w++) {
            if (!isDeloadWeek(w)) {
              anyValid = true;
              break;
            }
          }
          heading.style.display = "block";
          container.style.display = "block";
          if (!anyValid) {
            msgEl.textContent = "You're in a deload week — perfect time to recover and reflect. Coach insights will return once you're back in a training phase.";
          } else {
            msgEl.textContent = "You're in a deload week — perfect time to recover and reflect. No new insights for this week.";
          }
          return;
        }
      
        // 4) Gather all sessions (excluding deload weeks). If fewer than 2 total sessions for this exercise => no insights.
        let sessions = gatherSessionsForExercise(exerciseName, /*excludeDeload=*/true);
        if (sessions.length < 2) {
          heading.style.display = "block";
          container.style.display = "block";
          msgEl.textContent = "You're just getting started with this lift — need at least 2 logged sessions for insights!";
          return;
        }
      
        // 5) We do 3 checks:
        //    (1) Volume up/down since Week 1
        //    (2) Absolute weight up/down since Week 1
        //    (3) Heaviest top set progress or stagnation
        // We'll compile potential messages, then pick just 1 to display (random or priority-based).
      
        const earliestSession = sessions[0];  // The first session in a non-deload week
        const currentSession = sessions[sessions.length - 1]; // The most recent
      
        // (1) Volume difference
        let volDiff = currentSession.totalVolume - earliestSession.totalVolume;
        let volPctDiff = 0;
        if (earliestSession.totalVolume > 0) {
          volPctDiff = (volDiff / earliestSession.totalVolume) * 100;
        }
        // round them nicely
        volDiff = Math.round(volDiff);
        volPctDiff = Math.round(volPctDiff);
      
        let volumeMsg = "";
        if (volDiff > 0) {
          volumeMsg = `Your volume is up ${formatWeight(volDiff)} since Week 1 — you’re building serious momentum.`;
        } else if (volDiff < 0) {
          volumeMsg = `Volume has dropped ${Math.abs(volDiff)}kg since Week 1 — try dialing in your consistency or intensity.`;
        }
      
        let volumePctMsg = "";
        if (volPctDiff > 0) {
          volumePctMsg = `Your volume is up ${volPctDiff}% since Week 1 — you’re building serious momentum.`;
        } else if (volPctDiff < 0) {
          volumePctMsg = `Volume has dropped ${Math.abs(volPctDiff)}% since Week 1 — try dialing in your consistency or intensity.`;
        }
      
        // (2) Weighted top set difference
        // We track the heaviest top set each session => compare earliest vs current
        let topSetDiff = currentSession.topSetWeight - earliestSession.topSetWeight;
        let topSetMsg = "";
        if (topSetDiff > 0) {
          topSetMsg = `Your top set has climbed from ${earliestSession.topSetWeight}kg to ${currentSession.topSetWeight}kg — huge strength gains.`;
        } else if (topSetDiff < 0) {
          let absDiff = Math.abs(topSetDiff);
          topSetMsg = `Your top set dropped by ${absDiff}kg — consider focusing on form or consistent effort.`;
        }
      
        // (3) Stagnation check: if the last 3 sessions all have the same top set weight
        // or if it hasn't increased in 3+ consecutive sessions.
        let stagnationMsg = checkStagnation(sessions);
      
        // Build an array of all possible messages that are “true” for the user
        let possibleMessages = [];
        if (volumeMsg) possibleMessages.push(volumeMsg);
        if (volumePctMsg) possibleMessages.push(volumePctMsg);
        if (topSetMsg) possibleMessages.push(topSetMsg);
        if (stagnationMsg) possibleMessages.push(stagnationMsg);
      
        if (possibleMessages.length === 0) {
          // No changes at all => fallback
          return; // simply hide the coach insights
        }
      
        // We only display 1 message
        heading.style.display = "block";
        container.style.display = "block";
      
        // For simplicity, pick at random:
        let chosen = possibleMessages[Math.floor(Math.random() * possibleMessages.length)];
        msgEl.innerHTML = chosen;
      }
      
      // Helper: gather sessions for the given exercise, ignoring deload weeks, sorted by actual chronological order
      // Each session => { weekNum, dayNum, totalVolume, topSetWeight }
      function gatherSessionsForExercise(exerciseName, excludeDeload) {
        let arr = [];
        for (let w = 0; w < twelveWeekProgram.length; w++) {
          const weekNumber = twelveWeekProgram[w].week;
          if (excludeDeload && isDeloadWeek(weekNumber)) continue;
      
          const daysArr = twelveWeekProgram[w].days || [];
          for (let d = 0; d < daysArr.length; d++) {
            const setsCount = getSetsCountInDay(daysArr[d], exerciseName);
            if (setsCount <= 0) continue;
            // sum volume, find top set
            let totalVol = 0;
            let maxSet = 0;
            for (let s = 1; s <= setsCount; s++) {
              const awKey = getSetStorageKey(exerciseName, weekNumber, d + 1, s, "actualWeight");
              const arKey = getSetStorageKey(exerciseName, weekNumber, d + 1, s, "actualReps");
              let wVal = parseFloat(localStorage.getItem(awKey) || "0");
              let rVal = parseInt(localStorage.getItem(arKey) || "0", 10);
              totalVol += (wVal * rVal);
              if (wVal > maxSet) maxSet = wVal;
            }
            if (totalVol > 0 || maxSet > 0) {
              arr.push({
                weekNum: weekNumber,
                dayNum: d + 1,
                totalVolume: totalVol,
                topSetWeight: maxSet
              });
            }
          }
        }
        // sort by (weekNum ascending, dayNum ascending)
        arr.sort((a, b) => {
          if (a.weekNum !== b.weekNum) return a.weekNum - b.weekNum;
          return a.dayNum - b.dayNum;
        });
        return arr;
      }
      
      // Helper: if last 3 consecutive sessions have the same top set weight, we say it's stagnant
      function checkStagnation(sessions) {
        if (sessions.length < 3) return "";
        let len = sessions.length;
        let w0 = sessions[len - 3].topSetWeight;
        let w1 = sessions[len - 2].topSetWeight;
        let w2 = sessions[len - 1].topSetWeight;
        if (w0 === w1 && w1 === w2 && w2 > 0) {
          return `You've stayed at ${w2}kg for the past 3 sessions — 
            <a href="tutorial-placeholder.html" target="_blank">click here</a> 
            to focus on form.`;
        }
        return "";
      }
      
      /****************************************************************************
       *  BODY COMPOSITION & GOAL PROGRESS LOGIC
       ****************************************************************************/
      
      let bodyWeightChartInstance = null;
      let bodyWeightDataPoints = [];
      // This will store objects: { date: 'YYYY-MM-DD', weight: number }
      
      function showBodyCompositionSection() {
        const container = document.getElementById("bodyCompositionSection");
        if (!container) return;
      
        // If user has AWT, show the section:
        if (hasPurchasedAWT) {
          container.style.display = "block";
          initBodyWeightChart();
          loadGoalProgressInputs();
          updateGoalProgressUI();
          checkRecentMilestones();
          showBodyCompCoachInsights();
        } else {
          container.style.display = "none";
        }
      }
      
      /** Initialize the line chart for bodyweight **/
      function initBodyWeightChart() {
        const ctx = document.getElementById("bodyWeightChart");
        if (!ctx) return;
      
        // Gather any previously logged data from localStorage
        let stored = localStorage.getItem("bodyWeightLogs") || "[]";
        try {
          bodyWeightDataPoints = JSON.parse(stored);
        } catch (e) {
          bodyWeightDataPoints = [];
        }
      
        // Sort them by date
        bodyWeightDataPoints.sort((a, b) => new Date(a.date) - new Date(b.date));
      
        // Build labels & data arrays
        const labels = bodyWeightDataPoints.map(dp => dp.date);
        const weights = bodyWeightDataPoints.map(dp =>
          getPreferredWeightUnit() === "lbs" ? kgToLbs(dp.weight) : dp.weight
        );
      
        if (bodyWeightChartInstance) {
          bodyWeightChartInstance.destroy();
        }
      
        bodyWeightChartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: `Body Weight (${getPreferredWeightUnit()})`,
              data: weights,
              fill: false,
              tension: 0.1,
              pointRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                title: {
                  display: true,
                  text: "Date"
                }
              },
              y: {
                title: {
                  display: true,
                  text: `Weight (${getPreferredWeightUnit()})`
                },
                suggestedMin: 0 // or near the user's lowest weight
              }
            }
          }
        });
      }
      
      /** Redraw the chart after new logs **/
      function updateBodyWeightChart() {
        if (!bodyWeightChartInstance) return;
        // Re-sort the data in case new entries were added
        bodyWeightDataPoints.sort((a, b) => new Date(a.date) - new Date(b.date));
      
        const labels = bodyWeightDataPoints.map(dp => dp.date);
        const weights = bodyWeightDataPoints.map(dp =>
          getPreferredWeightUnit() === "lbs" ? kgToLbs(dp.weight) : dp.weight
        );
      
        bodyWeightChartInstance.data.labels = labels;
        bodyWeightChartInstance.data.datasets[0].data = weights;
        bodyWeightChartInstance.update();
      }
      
      /** Read stored goal/current from localStorage & populate inputs **/
      function loadGoalProgressInputs() {
        const goalWeightInput = document.getElementById("goalWeightInput");
        const goalByDateInput = document.getElementById("goalByDateInput");
        const currentWeightInput = document.getElementById("currentWeightInput");
        // const currentWeightDateInput = document.getElementById("currentWeightDateInput");
      
        // Stored values are always in kilograms
        const storedGoalKg = parseFloat(localStorage.getItem("userGoalWeight") || "");
        const storedCurrKg = parseFloat(localStorage.getItem("userCurrentWeight") || "");
        const storedGoalDate = localStorage.getItem("userGoalDate") || "";
        const storedCurrDate = localStorage.getItem("userCurrentWeightDate") || "";
      
        // Determine which unit to display
        const unit = getPreferredWeightUnit(); // "kg" or "lbs"
      
        // ─── 1) Populate Goal Weight field ─────────────────────────────
        // If we have a saved goal weight, convert to the user’s unit
        if (!isNaN(storedGoalKg)) {
          const displayGoal = unit === "lbs"
            ? kgToLbs(storedGoalKg).toFixed(1)
            : storedGoalKg.toFixed(1);
          goalWeightInput.value = displayGoal;
          goalWeightInput.placeholder = `${displayGoal} ${unit}`;
        } else {
          // no saved value yet, just show placeholder
          goalWeightInput.placeholder = `0.0 ${unit}`;
        }
        if (storedGoalDate) {
          goalByDateInput.value = storedGoalDate;
        }
      
        // ─── 2) Populate Current Weight field ──────────────────────────
        if (!isNaN(storedCurrKg)) {
          const displayCurr = unit === "lbs"
            ? kgToLbs(storedCurrKg).toFixed(1)
            : storedCurrKg.toFixed(1);
          // leave `value` blank so user types fresh, but show the placeholder
          currentWeightInput.value = "";
          currentWeightInput.placeholder = `${displayCurr} ${unit}`;
        } else {
          currentWeightInput.placeholder = `0.0 ${unit}`;
        }
        if (storedCurrDate) {
          // currentWeightDateInput.placeholder = storedCurrDate;
        }
      
        // ─── 3) Hook up the "Log Weight" button ────────────────────────
        const logBtn = document.getElementById("logWeightBtn");
        if (logBtn) {
          logBtn.addEventListener("click", handleLogWeight);
        }
      }
      
      /** Runs every time we need to recalc the progress bar, headings, etc. **/
      function updateGoalProgressUI() {
        // Figure out which title to show based on the user's main goal
        // localStorage might have it stored as "goal" or similar
        const userGoal = localStorage.getItem("goal") || "Weight Loss"; // fallback
      
        const goalProgressTitle = document.getElementById("goalProgressTitle");
        const goalProgressValue = document.getElementById("goalProgressValue");
      
        if (userGoal === "Weight Loss") {
          goalProgressTitle.textContent = "Total Weight Loss:";
        } else if (userGoal === "Muscle Gain") {
          goalProgressTitle.textContent = "Total Weight Gained:";
        } else {
          // e.g. "Improve Body Composition"
          goalProgressTitle.textContent = "Weight Change:";
        }
      
        // The user’s original start weight is stored (?), or we may use localStorage.getItem("userBodyweight")
        const startWeight = parseFloat(localStorage.getItem("weight") || "70"); // user’s original weight
      
        // The "most recent current" = from localStorage
        const recentWeight = parseFloat(localStorage.getItem("userCurrentWeight") || startWeight);
      
        // Weight difference
        let diff = recentWeight - startWeight;
        if (userGoal === "Weight Loss") {
          diff = startWeight - recentWeight; // so if they've lost, it’s positive
        }
        goalProgressValue.textContent = ` ${formatWeight(diff)} so far`;
        // (It’ll show negative for weight loss if the userGoal is "Muscle Gain" etc.)
      
        // Update progress bar
        updateGoalProgressBar();
      
        // Update estimated time 
        updateEstimatedTimeLeft();
      }
      
      /** The main function that runs when user clicks "Log Weight" **/
      function handleLogWeight() {
        const goalWeightInput = document.getElementById("goalWeightInput");
        const goalByDateInput = document.getElementById("goalByDateInput");
        const currentWeightInput = document.getElementById("currentWeightInput");
      
        // Read the raw numbers from the inputs (in user’s unit)
        let rawGoal = parseFloat(goalWeightInput.value || "");
        let rawCurr = parseFloat(currentWeightInput.value || "");
      
        if (isNaN(rawGoal)) {
          alert("Please enter your goal weight.");
          return;
        }
        if (isNaN(rawCurr)) {
          alert("Please enter your current weight.");
          return;
        }
      
        let goalDate = goalByDateInput.value;
        if (!goalDate) {
          alert("Please enter your goal date.");
          return;
        }
      
        // Convert both back to KG for storage/chart logic
        const goalKg = getPreferredWeightUnit() === "lbs"
          ? lbsToKg(rawGoal)
          : rawGoal;
        const currKg = getPreferredWeightUnit() === "lbs"
          ? lbsToKg(rawCurr)
          : rawCurr;
      
        // Today's date for logging
        const today = new Date().toISOString().slice(0, 10);
      
        // Persist
        localStorage.setItem("userGoalWeight", goalKg.toString());
        localStorage.setItem("userGoalDate", goalDate);
        localStorage.setItem("userCurrentWeight", currKg.toString());
        localStorage.setItem("userCurrentWeightDate", today);
      
        // Also add to chart data:
        bodyWeightDataPoints.push({ date: today, weight: currKg });
        localStorage.setItem("bodyWeightLogs", JSON.stringify(bodyWeightDataPoints));
      
        // Update the UI (placeholders, chart, progress, etc.)
        // — placeholder should continue to show in user unit
        if (getPreferredWeightUnit() === "lbs") {
          currentWeightInput.placeholder = kgToLbs(currKg).toFixed(1);
        } else {
          currentWeightInput.placeholder = currKg.toFixed(1);
        }
        currentWeightInput.value = "";             // clear the entry
        updateBodyWeightChart();                   // redraw chart
        updateGoalProgressUI();                    // progress bar & headings
      
        // Refresh any coach‑insights/milestones
        localStorage.removeItem("bodyCompCoachInsightDate");
        localStorage.removeItem("bodyCompCoachInsightMessage");
        checkRecentMilestones();
        showBodyCompCoachInsights();
      }
      
      /** Calculate the progress bar fill & percentage **/
      function updateGoalProgressBar() {
        const startWeight = parseFloat(localStorage.getItem("weight") || "70");
        const userGoal = localStorage.getItem("goal") || "Weight Loss";
        const goalWeight = parseFloat(localStorage.getItem("userGoalWeight") || startWeight);
        const currWeight = parseFloat(localStorage.getItem("userCurrentWeight") || startWeight);
      
        const fillEl = document.getElementById("weightProgressFill");
        const percentEl = document.getElementById("weightProgressPercent");
        if (!fillEl || !percentEl) return;
      
        let minVal = Math.min(startWeight, goalWeight);
        let maxVal = Math.max(startWeight, goalWeight);
      
        if (Math.abs(startWeight - goalWeight) < 0.01) {
          fillEl.style.width = "100%";
          percentEl.textContent = "100%";
          return;
        }
      
        let totalDist = Math.abs(goalWeight - startWeight);
        let progressDist = 0;
      
        if (userGoal === "Weight Loss") {
          // If user started heavier, we measure how much they've lost
          progressDist = startWeight - currWeight;
          // -- CHANGE #3a: clamp to 0 if negative (moving away from goal) --
          if (progressDist < 0) progressDist = 0;
          if (progressDist > totalDist) progressDist = totalDist;
        }
        else if (userGoal === "Muscle Gain") {
          progressDist = currWeight - startWeight;
          if (progressDist < 0) progressDist = 0;
          if (progressDist > totalDist) progressDist = totalDist;
        }
        else {
          // "Improve Body Composition" => we decide direction based on whether goalWeight < or > startWeight
          if (goalWeight < startWeight) {
            // Treat it like weight loss
            progressDist = startWeight - currWeight;
            if (progressDist < 0) progressDist = 0;
          } else {
            // Treat it like muscle gain
            progressDist = currWeight - startWeight;
            if (progressDist < 0) progressDist = 0;
          }
          if (progressDist > totalDist) progressDist = totalDist;
        }
      
        let pct = (progressDist / totalDist) * 100;
        if (pct < 0) pct = 0;
        if (pct > 100) pct = 100;
      
        fillEl.style.width = pct.toFixed(1) + "%";
        percentEl.textContent = pct.toFixed(1) + "%";
      }
      
      /** Estimate time left using either the deficit/surplus approach (if <2 logs) or a linear trend (>=2 logs) **/
      function updateEstimatedTimeLeft() {
        const estTimeEl = document.getElementById("estimatedTimeLeft");
        const estGoalDateEl = document.getElementById("estimatedGoalDate");
        const container = document.getElementById("estimatedTimeContainer");
        if (!estTimeEl || !estGoalDateEl || !container) return;
      
        // Clear old text, hide container by default.
        estTimeEl.textContent = "";
        estGoalDateEl.textContent = "";
        container.style.display = "none";
      
        const goalWeight = parseFloat(localStorage.getItem("userGoalWeight") || "0");
        const currWeight = parseFloat(localStorage.getItem("userCurrentWeight") || "0");
      
        // If user hasn't set a goal/current weight, do nothing more.
        if (!goalWeight || !currWeight) {
          return;
        }
      
        // If we have fewer than 2 logs, use the 7700kcal assumption.
        if (bodyWeightDataPoints.length < 2) {
          let dailyCalsWkKeys = [];
          for (let i = 1; i <= 12; i++) {
            dailyCalsWkKeys.push(`week${i}_dailyCalsWMCO`);
          }
      
          let totalNetKcal = 0;
          const maintenanceCals = parseInt(localStorage.getItem("maintenanceCals") || "2200", 10);
      
          for (let i = 0; i < dailyCalsWkKeys.length; i++) {
            let programVal = parseInt(localStorage.getItem(dailyCalsWkKeys[i]) || "0", 10);
            if (programVal > 0) {
              let net = maintenanceCals - programVal;
              totalNetKcal += net * 7;
            }
          }
      
          let kgChange = totalNetKcal / 7700;
          let needed = Math.abs(goalWeight - currWeight);
      
          // If net is zero, we can't estimate properly
          if (kgChange === 0) {
            estTimeEl.textContent = "No deficit/surplus found."; // Put a period here
            return; // container stays hidden
          }
      
          let weeksNeeded = needed / Math.abs(kgChange / 12);
          let wks = Math.ceil(weeksNeeded);
          if (wks < 1) wks = 1;
      
          // If more than 20 weeks, hide entirely
          if (wks > 20) {
            return;
          }
      
          // If it’s 1 or 2+ weeks, add a period at the end
          let weekLabel = (wks === 1) ? "1 Week." : `${wks} Weeks.`;
      
          // Fill the text nodes
          estTimeEl.textContent = weekLabel;
      
          // Add a period after the date as well
          let now = new Date();
          now.setDate(now.getDate() + wks * 7);
          estGoalDateEl.textContent = formatDateForDisplay(now) + ".";
      
          // Finally, show the container
          container.style.display = "block";
          return;
        }
      
        // If we have 2+ logs, do slope approach
        let sorted = [...bodyWeightDataPoints].sort((a, b) => new Date(a.date) - new Date(b.date));
        let firstEntry = sorted[0];
        let lastEntry = sorted[sorted.length - 1];
      
        let deltaWeight = lastEntry.weight - firstEntry.weight;
        let deltaDays = (new Date(lastEntry.date) - new Date(firstEntry.date)) / (1000 * 60 * 60 * 24);
        if (deltaDays < 1) deltaDays = 1;
      
        let slopePerDay = deltaWeight / deltaDays;
        let needed = goalWeight - currWeight;
      
        // If slope is ~0 => “stalled”
        if (Math.abs(slopePerDay) < 0.001) {
          // No display
          return;
        }
      
        // If negative => user is moving away from goal
        let daysNeeded = needed / slopePerDay;
        if (daysNeeded < 0) {
          return;
        }
      
        let roundDays = Math.ceil(daysNeeded);
        let wks = Math.ceil(roundDays / 7);
        if (wks < 1) wks = 1;
        if (wks > 20) {
          return;
        }
      
        let weekLabel = (wks === 1) ? "1 Week." : `${wks} Weeks.`;
        estTimeEl.textContent = weekLabel;
      
        let now = new Date();
        now.setDate(now.getDate() + roundDays);
        estGoalDateEl.textContent = formatDateForDisplay(now) + ".";
      
        container.style.display = "block";
      }
      
      // Same date formatter as before
      function formatDateForDisplay(dateObj) {
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return dateObj.toLocaleDateString(undefined, options);
      }
      
      /** Check for recent milestone triggers & display a single random message if any. **/
      function checkRecentMilestones() {
        const mileEl = document.getElementById("recentMilestones");
        if (!mileEl) return;
      
        // 1) figure out the user's goal
        const rawGoal = localStorage.getItem("userGoal") || localStorage.getItem("goal") || "";
        const goal = rawGoal.toLowerCase().trim();
        const isWeightLoss = goal.includes("loss");
        const isMuscleGain = goal.includes("gain");
        const isBodyComp   = goal.includes("composition") || goal.includes("comp");
      
        // 2) collect any milestones
        const triggered = [];
      
        if (bodyWeightDataPoints.length > 1) {
          const latest = bodyWeightDataPoints[bodyWeightDataPoints.length - 1].weight;
      
          // lowest
          const lowest = Math.min(...bodyWeightDataPoints.map(p => p.weight));
          if ((isWeightLoss || isBodyComp) && latest === lowest) {
            triggered.push("You've hit a new lowest weight — amazing progress!");
          }
      
          // highest
          const highest = Math.max(...bodyWeightDataPoints.map(p => p.weight));
          if ((isMuscleGain || isBodyComp) && latest === highest) {
            triggered.push("New peak weight achieved — solid work building mass!");
          }
        }
      
        // 3) exact goal‐weight check
        const goalWeight = parseFloat(localStorage.getItem("userGoalWeight") || "0");
        const currWeight = parseFloat(localStorage.getItem("userCurrentWeight") || "0");
        if (goalWeight > 0 && Math.abs(currWeight - goalWeight) < 0.1) {
          triggered.push("Goal reached — incredible job sticking with it!");
        }
      
        // 4) render or hide
        if (triggered.length === 0) {
          mileEl.style.display = "none";
          mileEl.textContent = "";
        } else {
          mileEl.style.display = "block";
          mileEl.classList.add("coach-insights-note");
          mileEl.textContent = triggered[Math.floor(Math.random() * triggered.length)];
        }
      }

      function initFloatingCTA() {
        const floatingCTA = document.getElementById("floating-cta");
        const ctaStop = document.getElementById("ctaStopContainer");
        if (!floatingCTA || !ctaStop) return;
      
        /* fade in once after render */
        setTimeout(() => floatingCTA.classList.add("cta-visible"), 250);
      
        /* track whether we’re currently pinned */
        let pinned = false;
      
        function handleScroll() {
          const ctaBottom = window.scrollY + window.innerHeight - 20;      // 20px bottom offset
          const stopTop = ctaStop.getBoundingClientRect().top + window.scrollY;
      
          if (ctaBottom >= stopTop && !pinned) {
            floatingCTA.classList.add("pinned");
            floatingCTA.classList.remove("shadow-active");
            pinned = true;
          } else if (ctaBottom < stopTop && pinned) {
            floatingCTA.classList.remove("pinned");
            if (window.innerWidth >= 768) floatingCTA.classList.add("shadow-active");
            pinned = false;
          }
        }
      
        function handleResize() {
          if (!pinned && window.innerWidth >= 768) {
            floatingCTA.classList.add("shadow-active");
          } else {
            floatingCTA.classList.remove("shadow-active");
          }
        }
      
        /* ← here’s the only change: call it once right away: */
        handleResize();
        handleScroll();                // ← dock it immediately under your feature count
      
        window.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("resize", handleResize, { passive: true });
      
        /* click → go to offer page */
        floatingCTA
          .querySelector(".claim-program-btn")
          .addEventListener("click", () => window.location.href = "offer.html");
      
        setTimeout(() => {
          floatingCTA.classList.add("cta-visible");
      
          // after the 1.5s fade finishes, kill the transform transition
          setTimeout(() => {
            floatingCTA.classList.remove("fade-in-cta");
          }, 1500);
        }, 250);
      }

      function renderMyProgressForCore() {
        const cont = document.getElementById("myProgressContainer");
        if (!cont) return;
      
        // ← grab the right week number from localStorage
        const weekNumber = parseInt(
          localStorage.getItem("activeWorkoutWeek") || "1",
          10
        );
      
        cont.innerHTML = "";
      
        /* a) HERO ---------------------------------------------------- */
        cont.insertAdjacentHTML("beforeend", `
          <section id="mp-core-hero">
            <h2>Your Progress Deserves the Full Picture</h2>
            <p>Track your consistency, strength, and body changes — plus smart insights built from your real data.</p>
          </section>
        `);
      
        // **This** line must use `weekNumber`:
        const stats = getWeeklyStats(weekNumber);
        if (stats.workoutsCompleted > 0) {
          const sum = document.createElement("p");
          sum.style.cssText = "font:500 1rem/1.6 Poppins,sans-serif;text-align:center;margin-bottom:25px";
          sum.textContent =
            `You’ve completed ${stats.workoutsCompleted} workouts and lifted ` +
            `${stats.totalWeight.toLocaleString()} kg this week. Want to see what that adds up to?`;
          cont.appendChild(sum);
        }
      
        /* c) 5 glass cards ------------------------------------------ */
        const cardInfo = [
          {
            h: "One Score. Total Progress.",
            b: "The Progress Score tracks your effort, consistency, and workouts — all in one evolving number that reflects your long-term growth."
          },
          {
            h: "Your Week in Highlights",
            b: "Get a clear summary of your training — including top lifts, total volume, and personal highlights — all in one motivational snapshot."
          },
          {
            h: "Strength Trends That Guide You",
            b: "Spot patterns in your training with visual graphs and coach insights — built to help you lift smarter, not harder."
          },
          {
            h: "Real Feedback. No Guesswork.",
            b: "Get clear feedback on each lift — so you always know when you're improving, when you've stalled, and what to do next."
          },
          {
            h: "Your Weight. Your Timeline.",
            b: "Log your weight, monitor change over time, and get a projected timeline for your goal — with milestone celebrations to keep you motivated."
          }
        ];
      
        const wrap = document.createElement("div");
        wrap.id = "mp-core-glass-wrap";
        cardInfo.forEach(ci => {
          const card = document.createElement("div");
          card.className = "mp-glass-card";
          card.innerHTML = `
            <h3>${ci.h}</h3>
            <div class="pt-extra-container">
              <span class="crown-emoji">👑</span>
              <span class="pt-extra">Pro Tracker Only</span>
            </div>
            <p>${ci.b}</p>
          `;
          wrap.appendChild(card);
        });
        cont.appendChild(wrap);
      
      
        /* d) feature‑count & bar ------------------------------------ */
        cont.insertAdjacentHTML("beforeend", `
           <p id="mp-core-feature-count">
              You’ve unlocked 23 out of 65 total features.<br>
              Pro Tracker gives you access to 42 additional tools to maximize results.
           </p>
           <div id="mp-core-progress-bar"><div></div></div>
        `);
      
        if (!document.getElementById("floatingCtaContainer")) {
          cont.insertAdjacentHTML(
            "beforeend",
            `
            <div class="floating-cta-container" id="floatingCtaContainer">
              <div class="floating-cta fade-in-cta" id="floating-cta">
                <button class="claim-program-btn">🔓 Unlock Pro Tracker</button>
              </div>
            </div>
            <!-- stop marker (where CTA docks) -->
            <div id="ctaStopContainer"></div>
            `
          );
        }
      
        // if (!window.__ctaInitDone) {
        //   initFloatingCTA();
        //   window.__ctaInitDone = true;
        // }

        initFloatingCTA();
      
        // Testimonial Section – now rendered after the CTA
        cont.insertAdjacentHTML("beforeend", `
        <div class="testimonial-section fullwidth-testimonial">
          <h2>Real Progress. No Guesswork.</h2>
          <p class="hero-text">
            They stopped guessing and started growing — and so can you.
          </p>
          <div class="testimonial-container">
            <button class="arrow-button prev">❮</button>
            <div class="testimonial-slider"></div>
            <button class="arrow-button next">❯</button>
          </div>
          <div class="dots-container"></div>
        </div>
      `);
      
        const reviews = [
          {
            name: "David",
            text: "The strength graphs showed me I was improving even on the weeks I felt off. That feedback gave me confidence — and helped me stay consistent long enough to gain real muscle.",
            beforeImage: "../assets/harry_chest_before.jpg",
            afterImage:  "../assets/harry_chest_after.jpg",
            testImage:   "../assets/5-stars.png",
          },
          {
      
            name: "Maria",
            text: "Seeing my streaks and Progress Score tick up each week made all the difference. I wasn’t just guessing anymore — I could actually see myself improving.",
            beforeImage: "../assets/halima_back_before.jpg",
            afterImage:  "../assets/halima_back_after.jpg",
            testImage:   "../assets/5-stars.png",
          },
          {
            name: "Lee",
            text: "The Coach Insights and milestone tracking kept me grounded. I’d see a new lowest weight logged or a consistency badge, and it reminded me this was actually working.",
            beforeImage: "../assets/lynn_before.JPEG",
            afterImage:  "../assets/lynn_after.png",
            testImage:   "../assets/5-stars.png",
          },
        ];
      
        const sliderContainer = document.querySelector(".testimonial-slider");
        const prevBtn = document.querySelector(".arrow-button.prev");
        const nextBtn = document.querySelector(".arrow-button.next");
        const dotsContainer = document.querySelector(".dots-container");
      
        let currentIndex = 0;
        let startX = 0;
        let endX = 0;
      
        // Create a testimonial slot
        function createTestimonialCards() {
          // Clear existing content
          sliderContainer.innerHTML = "";
      
          reviews.forEach((review, index) => {
            // Create a .testimonial-card
            const card = document.createElement("div");
            card.classList.add("testimonial-card");
      
            // HTML for each card (similar to your existing structure)
            card.innerHTML = `
                  <div class="images">
                    <div class="before">
                      <img src="${review.beforeImage}" alt="Before">
                      <p>Before</p>
                    </div>
                    <div class="after">
                      <img src="${review.afterImage}" alt="After">
                      <p>After</p>
                    </div>
                  </div>
                  <p class="review-name">${review.name}</p>
                  <div class="five-stars">
                    <img src="${review.testImage}" alt="5 Stars">
                  </div>
                  <p class="review-text">${review.text}</p>
                `;
      
            sliderContainer.appendChild(card);
          });
        }
      
        // 2) Create & update the dots
        function createDots() {
          dotsContainer.innerHTML = "";
          reviews.forEach((_, index) => {
            const dot = document.createElement("div");
            dot.classList.add("dot");
            if (index === currentIndex) dot.classList.add("active");
            // Clicking a dot => jump to that slide
            dot.addEventListener("click", () => {
              currentIndex = index;
              updateSlider();
            });
            dotsContainer.appendChild(dot);
          });
        }
      
        // 3) Move the slider to the currentIndex & update dots
        function updateSlider() {
          const slideWidth = sliderContainer.clientWidth; // each card is 100% of this container
          sliderContainer.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
      
          // Update dots
          const allDots = dotsContainer.querySelectorAll(".dot");
          allDots.forEach((dot, idx) => {
            dot.classList.toggle("active", idx === currentIndex);
          });
        }
      
        // 4) Arrow button handlers
        function goNext() {
          currentIndex = (currentIndex + 1) % reviews.length;
          updateSlider();
        }
        function goPrev() {
          currentIndex = (currentIndex - 1 + reviews.length) % reviews.length;
          updateSlider();
        }
      
        // 5) Mobile swipe detection
        function enableSwipe() {
          // listen on the outer container, not the inner slider
          const testimonialWrapper = document.querySelector(".testimonial-container");
          testimonialWrapper.addEventListener("touchstart", (e) => {
            startX = e.touches[0].clientX;
          });
        
          testimonialWrapper.addEventListener("touchend", (e) => {
            endX = e.changedTouches[0].clientX;
            if      (startX - endX > 50) goNext();
            else if (endX - startX > 50) goPrev();
          });
        }
        
        // …and then later in your init code…
        if (typeof createTestimonialCards === "function") {
          createTestimonialCards();   // build the slides
          createDots();               // build the dots
          enableSwipe();              // now anywhere in the container will detect a swipe!
          nextBtn.addEventListener("click", goNext);
          prevBtn.addEventListener("click", goPrev);
          updateSlider();
        }
      }

      window.getWeeklyStats          = getWeeklyStats;
      window.renderMyProgressForCore = renderMyProgressForCore;
      window.updateWeeklyTotals      = updateWeeklyTotals;
      window.renderWeeklyRecapAndImprovements = renderWeeklyRecapAndImprovements;
      // window.showTodaysTipIfAny            = showTodaysTipIfAny;
      window.showBodyCompositionSection   = showBodyCompositionSection;
    })();

    