chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startAutomation") {
      performLinkedInAutomation(request.searchQuery, request.maxPages);
    }
    return true;
  });
  function performLinkedInAutomation(searchQuery, maxPages = 3) {
    let currentPage = 1;
    
    function performSearch() {
      const searchContainer = document.querySelector('div.search-global-typeahead.global-nav__search-typeahead');
      
      if (searchContainer) {
        const searchButton = searchContainer.querySelector('button');
        
        if (searchButton) {
          searchButton.click();
          console.log('Search button clicked');
          
          setTimeout(() => {
            const searchInput = document.querySelector('input.search-global-typeahead__input');
            
            if (searchInput) {
              searchInput.value = searchQuery;
              searchInput.dispatchEvent(new Event('input', { bubbles: true }));
              searchInput.dispatchEvent(new KeyboardEvent('keydown', { 
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                bubbles: true
              }));
              
              console.log(`Search performed for: ${searchQuery}`);
              setTimeout(clickPeopleButton, 3000);
            } else {
              console.error('Search input field not found');
            }
          }, 1000); 
        } else {
          console.error('Search button not found');
        }
      } else {
        console.error('LinkedIn search container not found');
      }
    }
    
    function clickPeopleButton() {
      const peopleButton = Array.from(document.querySelectorAll('button.artdeco-pill'))
        .find(button => button.textContent.trim() === "People");
        
      if (peopleButton) {
        peopleButton.click();
        console.log('People button clicked successfully');
        setTimeout(startConnectingProcess, 3000);
      } else {
        const pillButton = document.querySelector('button.artdeco-pill.artdeco-pill--slate.artdeco-pill--choice.artdeco-pill--2.search-reusables__filter-pill-button');
        
        if (pillButton?.textContent.trim() === "People") {
          pillButton.click();
          console.log('People button clicked using alternative method');
          setTimeout(startConnectingProcess, 3000);
        } else {
          console.error('People button not found');
        }
      }
    }
    
    function debugAvailableButtons() {
      console.log("Debugging available buttons:");
      const allButtons = document.querySelectorAll('button');
      console.log(`Total buttons: ${allButtons.length}`);
      
      const connectButtons = Array.from(allButtons).filter(btn => {
        const label = btn.getAttribute('aria-label') || '';
        return label.toLowerCase().includes('connect') || 
               label.toLowerCase().includes('invite') ||
               btn.textContent.toLowerCase().includes('connect');
      });
      
      console.log("Potential connect buttons:", connectButtons.length);
      connectButtons.forEach((btn, i) => {
        console.log(`Button ${i+1} aria-label:`, btn.getAttribute('aria-label'));
        console.log(`Button ${i+1} text:`, btn.textContent.trim());
      });
      
      const nextButtons = Array.from(allButtons).filter(btn => {
        const label = btn.getAttribute('aria-label') || '';
        return label.toLowerCase().includes('next') || 
               btn.textContent.toLowerCase().includes('next');
      });
      
      console.log("Potential next buttons:", nextButtons.length);
      nextButtons.forEach((btn, i) => {
        console.log(`Next button ${i+1} aria-label:`, btn.getAttribute('aria-label'));
        console.log(`Next button ${i+1} text:`, btn.textContent.trim());
        console.log(`Disabled:`, btn.hasAttribute('disabled'));
      });
      
      return connectButtons;
    }
    
    function startConnectingProcess() {
      console.log(`Processing page ${currentPage} of ${maxPages}`);
      const debugButtons = debugAvailableButtons();
      
      let connectButtons = Array.from(document.querySelectorAll('button[aria-label^="Invite"][aria-label$="to connect"]'));
      
      if (connectButtons.length === 0 && debugButtons.length > 0) {
        connectButtons = debugButtons;
      }
      
      console.log(`Found ${connectButtons.length} connect buttons`);
      
      if (connectButtons.length === 0) {
        if (currentPage < maxPages) {
          goToNextPage();
        } else {
          console.log(`Reached max pages (${maxPages}). Stopping.`);
        }
        return;
      }
      
      function processNextButton(index) {
        if (index >= connectButtons.length) {
          console.log("All connect requests on this page completed!");
          
          // Move to the next page if within page limit
          if (currentPage < maxPages) {
            setTimeout(goToNextPage, 3000);
          } else {
            console.log(`Reached maximum page limit (${maxPages}). Stopping automation.`);
          }
          return;
        }
        
        // Scroll the button into view
        connectButtons[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Wait a moment after scrolling before clicking
        setTimeout(() => {
          // Click the connect button
          try {
            connectButtons[index].click();
            console.log(`Clicked connect button ${index + 1}`);
            
            // Wait for the modal to appear, then click "Send without a note"
            setTimeout(() => {
              try {
                // Try multiple approaches to find the "Send without a note" button
                let sendWithoutNoteBtn = document.querySelector('button[aria-label="Send without a note"]');
                
                if (!sendWithoutNoteBtn) {
                  // Try by text content
                  const buttons = Array.from(document.querySelectorAll('button'));
                  sendWithoutNoteBtn = buttons.find(btn => {
                    return btn.textContent.trim().toLowerCase().includes('send without') ||
                           btn.textContent.trim().toLowerCase() === 'send';
                  });
                }
                
                if (sendWithoutNoteBtn) {
                  sendWithoutNoteBtn.click();
                  console.log(`Sent invitation ${index + 1} without a note`);
                } else {
                  console.warn(`Modal dialog not found for button ${index + 1}. Continuing to next connect button.`);
                }
                
                // Process the next button after a delay
                setTimeout(() => {
                  processNextButton(index + 1);
                }, 3000);
                
              } catch (error) {
                console.error(`Failed to send invitation ${index + 1}:`, error);
                // Continue with the next button despite error
                setTimeout(() => {
                  processNextButton(index + 1);
                }, 3000);
              }
            }, 2000); // Wait 2 seconds for modal to appear
            
          } catch (error) {
            console.error(`Failed to click connect button ${index + 1}:`, error);
            // Continue with the next button despite error
            setTimeout(() => {
              processNextButton(index + 1);
            }, 3000);
          }
        }, 1000);
      }
      
      // Start the process with the first button
      if (connectButtons.length > 0) {
        processNextButton(0);
      }
    }
    
    // Function to navigate to the next page
    function goToNextPage() {
      console.log("Attempting to go to the next page...");
      
      // Try multiple approaches to find the Next button
      let nextButton = null;
      
      // Try by aria-label
      nextButton = document.querySelector('button[aria-label="Next"]');
      
      // If not found, try by class names
      if (!nextButton) {
        nextButton = document.querySelector('button.artdeco-pagination__button--next');
      }
      
      // If still not found, try by text content
      if (!nextButton) {
        const buttons = Array.from(document.querySelectorAll('button'));
        nextButton = buttons.find(button => {
          // Check direct text content
          if (button.textContent.trim().toLowerCase() === 'next') return true;
          
          // Check span inside button
          const span = button.querySelector('span');
          return span && span.textContent.trim().toLowerCase() === 'next';
        });
      }
      
      // If still not found, try to find pagination div and get the right-most button
      if (!nextButton) {
        const paginationDiv = document.querySelector('div.artdeco-pagination');
        if (paginationDiv) {
          const buttons = Array.from(paginationDiv.querySelectorAll('button'));
          if (buttons.length > 0) {
            // Get the last non-disabled button
            const activeButtons = buttons.filter(btn => !btn.hasAttribute('disabled'));
            if (activeButtons.length > 0) {
              nextButton = activeButtons[activeButtons.length - 1];
            }
          }
        }
      }
      
      // Check if button exists and is not disabled
      if (nextButton && !nextButton.hasAttribute('disabled')) {
        // Scroll the next button into view
        nextButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Click the next button after a short delay
        setTimeout(() => {
          nextButton.click();
          console.log("Clicked Next button, navigating to next page");
          
          // Increment page counter
          currentPage++;
          console.log(`Now on page ${currentPage} of ${maxPages}`);
          
          // Wait for the new page to load, then restart the connection process
          setTimeout(startConnectingProcess, 5000);
        }, 1000);
      } else {
        if (nextButton && nextButton.hasAttribute('disabled')) {
          console.log("Next button is disabled. Reached the last page of results.");
        } else {
          console.log("Next button not found. Unable to navigate to the next page.");
          console.log("Try running the following in the console to manually find the next button:");
          console.log(`
            // Debug code to find next button:
            const buttons = Array.from(document.querySelectorAll('button'));
            buttons.forEach(btn => {
              if (btn.textContent.toLowerCase().includes('next')) {
                console.log('Potential next button:', btn);
              }
            });
          `);
        }
      }
    }
    
    // Start the automation process
    performSearch();
  }