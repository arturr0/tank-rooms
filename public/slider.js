$(document).ready(function () { 
            let index = 1; // Initial section index

            $(".left-arrow").click(function () { 
                index--; // Decrement index

                if (index < 1) {
                    index = 3; // Wrap around to the last section if index goes below 1
                }

                // Update href attribute of both left and right arrows
                $(".arrow__btn").prop("href", `#section${index}`); 
            });

            $(".right-arrow").click(function () { 
                index++; // Increment index

                if (index > 3) {
                    index = 1; // Wrap around to the first section if index exceeds 3
                }

                // Update href attribute of both left and right arrows
                $(".arrow__btn").prop("href", `#section${index}`); 
            });
        }); 