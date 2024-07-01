$(document).ready(function() {
    let find = false;
    let currentScrollIndex = 0;
    let scroll = false;
    let rowsToScroll = [];
    let playerName = "";

    // Function to highlight rows where players === 1
    function highlightUserRow(jsonData) {
        if (scroll) rowsToScroll = [];
        $('#serversTable tbody tr').each(function(index) {
            const $row = $(this);
            const serverIndex = $row.find('.button_spin').data('index');

            // Check if player at current index in jsonData has players === 1
            if ((jsonData[serverIndex] && jsonData[serverIndex].players === 1 && playerName == "") ||
                (jsonData[serverIndex] && jsonData[serverIndex].players === 1 && 
                (jsonData[serverIndex].user1 == playerName || jsonData[serverIndex].user2 == playerName)
                )) {
                $row.find('.join').addClass('green-border');
                if (scroll) rowsToScroll.push($row); // Collect row element with green border
            } else {
                $row.find('.join').removeClass('green-border');
            }
        });

        // Scroll to the next row with green border sequentially
    }

    // Function to scroll to the next row with green border
    function scrollToNextRow() {
        if (currentScrollIndex >= rowsToScroll.length) {
            currentScrollIndex = 0;
        }

        const $nextRow = rowsToScroll[currentScrollIndex];
        const containerScrollTop = $('#table-container').scrollTop();
        const containerHeight = $('#table-container').height();
        const rowOffsetTop = $nextRow.offset().top - $('#serversTable').offset().top;
        const rowHeight = $nextRow.outerHeight();

        // Calculate the new scroll position to center the row in the container
        const scrollTo = rowOffsetTop - (containerHeight / 2) + (rowHeight / 2);

        // Animate scroll to the calculated position
        $('#table-container').animate({
            scrollTop: scrollTo
        }, 500);

        currentScrollIndex++; // Move to the next index for the next scroll
    }

    // Event handler for creating a server
    $('#createServer').on('click', function() {
        $.post('/create-server')
            .done(function(data) {
                $('tbody').append(`
                    <tr id="server-${data.index}">
                        <td class="server">SERVER ${data.index + 1}</td>
                        <td class="button_spin" data-index="${data.index}" data-players="${data.players}">
                            <button class="join button visible">JOIN</button>
                            <i class="icon-spin5 hidden"></i>
                        </td>
                        <td class="players">${data.user1}</td>
                        <td class="players">${data.user2}</td>
                    </tr>
                `);
                attachJoinHandlers();
                const $tableContainer = $('#table-container');
                $tableContainer.animate({
                    scrollTop: $tableContainer[0].scrollHeight
                }, 500);
            })
            .fail(function(error) {
                console.error('Error:', error);
            });
    });

    // Function to update the server list
    function updateServerList() {
        $.get('/servers-data')
            .done(function(jsonData) {
                var scrollPos = $(window).scrollTop();
                $('#serversTable tbody').empty();

                jsonData.forEach((server, index) => {
                    let joinButton = 'FULL';
                    if (server.players < 2) {
                        joinButton = '<button class="join button visible">JOIN</button>';
                    }

                    $('#serversTable tbody').append(`
                        <tr id="server-${index}">
                            <td class="server">SERVER ${index + 1}</td>
                            <td class="button_spin" data-index="${index}" data-players="${server.players}">
                                ${joinButton}
                                <i class="icon-spin5 hidden"></i>
                            </td>
                            <td class="players">${server.user1}</td>
                            <td class="players">${server.user2}</td>
                        </tr>
                    `);
                });

                //$(window).scrollTop(scrollPos);
                scroll = false;

                if (find) {
                    highlightUserRow(jsonData);
                    //scrollToNextRow();
                }
                attachJoinHandlers();
                $('#table-container').css('visibility', 'visible');
            })
            .fail(function(error) {
                console.error('Error updating server list:', error);
            });
    }

    // Function to attach join handlers to join buttons
    function attachJoinHandlers() {
        $('.join').off('click').on('click', function(event) {
            event.preventDefault();
            const inputText = $('#yourName').val().trim();
            if (!inputText) {
                alert('Please enter text before joining a server.');
                return;
            }

            const $joinButton = $(this);
            $joinButton.prop('disabled', true);

            const serverJoin = $joinButton.closest('.button_spin');
            const serverIndex = serverJoin.data('index');

            $.get('/servers-data')
                .done(function(jsonData) {
                    const latestServerData = jsonData[serverIndex];

                    if (latestServerData.user1 === inputText || latestServerData.user2 === inputText) {
                        alert('You cannot use the same name as an existing player.');
                        $joinButton.prop('disabled', false);
                        return;
                    }

                    if (latestServerData.user1 === "") {
                        $.post('/submit', { inputText: inputText, index: serverIndex })
                            .done(function(data) {
                                localStorage.setItem('serverData', JSON.stringify({
                                    inputText: inputText,
                                    index: serverIndex,
                                    players: data.players,
                                    player: 1
                                }));
                                window.location.href = '/warcaby';
                            })
                            .fail(function(error) {
                                console.error('Error:', error);
                                $joinButton.prop('disabled', false);
                            });
                    } else if (latestServerData.user2 === "" && latestServerData.block === 0) {
                        $.post('/submit', { inputText: inputText, index: serverIndex })
                            .done(function(data) {
                                localStorage.setItem('serverData', JSON.stringify({
                                    inputText: inputText,
                                    index: serverIndex,
                                    players: data.players,
                                    player: 2
                                }));
                                window.location.href = '/warcaby';
                            })
                            .fail(function(error) {
                                console.error('Error:', error);
                                $joinButton.prop('disabled', false);
                            });
                    } else {
                        $joinButton.prop('disabled', false);
                        const $spinIcon = $joinButton.parent('.button_spin').find('.icon-spin5');
                        $joinButton.removeClass('visible');
                        $joinButton.addClass('hidden');
                        $spinIcon.removeClass('hidden');
                        $spinIcon.addClass('animate-spin');
                    }
                })
                .fail(function(error) {
                    console.error('Error fetching latest server data:', error);
                    $joinButton.prop('disabled', false);
                });
        });
    }

    // Initial update of server list and setup
    updateServerList();

    // Click handler for finding players and highlighting rows
    $(document).on('click', '#find_players', function() {
        $.get('/find')
            .done(function(jsonData) {
                find = true;
                scroll = true;
                highlightUserRow(jsonData);
                if (rowsToScroll.length > 0) scrollToNextRow(); // Scroll to the first row immediately
            })
            .fail(function(error) {
                console.error('Error fetching player data:', error);
            });
    });
    
    
    const findPlayersButton = document.getElementById('find_players');
    findPlayersButton.addEventListener('click', () => {
      
      const playersNameInput = document.getElementById('playersName');
      playerName = playersNameInput.value.trim();;
      console.log(`Player's name input: ${playerName}`);
    });
  

    // Regularly update server list
    setInterval(updateServerList, 5000);
});
