function createTextBox(top = "100px", left = "50%", width = "300px", borderRadius = "5px", align = "left", font = "Pixelify Sans") {
    const textBox = document.createElement("div");
    textBox.className = "text-box";
    textBox.style.position = "absolute";
    textBox.style.width = width;
    textBox.style.zIndex = "10";
    textBox.style.top = top;
    textBox.style.left = left;
    textBox.style.padding = "40px";
    textBox.style.transform = "translateX(-50%)";
    textBox.style.padding = "10px";
    textBox.style.backgroundColor = "rgba(234, 212, 170, 1)";
    textBox.style.color = "black";
    textBox.style.border = "1px solid rgba(184,111,80,1)";
    textBox.style.borderRadius = borderRadius;
    textBox.style.zIndex = "1000";
    textBox.style.fontSize = "20px";
    textBox.style.fontFamily = font;
    textBox.style.fontOpticalSizing = "auto";
    textBox.style.whiteSpace = "pre-wrap";
    textBox.innerText = "";
    textBox.style.textAlign = align;
    return textBox;
}

export async function displayInterractButton(text) {
    // Display a circular text box at the top right of the screen
  displayTextBox(text, 1000/60, "700px", "100px", "20px", "50%", "center", "arial", "false");
}

export async function displayTextBoxSeries(texts, duration = 0) {
    // Displays a series of text boxes
    const skipTutorial = (e) => {
        if (e.key === "Escape") {
            console.log("Tutorial skipped");
            for (let textBox of document.getElementsByClassName("text-box")) {
                document.body.removeChild(textBox);
            }
            removeEventListener("keydown", skipTutorial);
            return;
        }
    };
    addEventListener("keydown", skipTutorial);
    for (let text of texts) {
        await displayTextBox(text, duration);
    }
}

export async function displayTextBox(text, duration = 0, top = "100px", left = "50%", width = "300px", borderRadius = "5px", align = "left", font = "Pixelify Sans", remove = true) {
    // Remove any existing text boxes
    if (remove) {
      const textBoxes = document.getElementsByClassName("text-box");
      for (let textBox of textBoxes) {
          document.body.removeChild(textBox);
          
      }
    }
    const textBox = createTextBox(top, left, width, borderRadius, align, font);

    for (let i = 0; i < text.length; i++) {
        textBox.innerText += text[i];
        document.body.appendChild(textBox);
        let writeTime = 5;
        if (
            text[i] === "." ||
            text[i] === "!" ||
            text[i] === "?" ||
            text[i] === ","
        ) {
            writeTime = 400;
        } else {
            writeTime = 30;
        }
        await new Promise((r) => setTimeout(r, writeTime));
    }

    if (duration > 0) {
        await new Promise((resolve) => {
            setTimeout(() => {
                try {
                    document.body.removeChild(textBox);
                } catch (e) {
                    console.log(
                        "Error removing text box, probably already removed"
                    );
                }
                resolve();
            }, duration);
        });
    } else {
        await new Promise((resolve) => {
            const removeTextBoxOnE = (e) => {
                if (e.key === "e") {
                    document.body.removeChild(textBox);
                    removeEventListener("keydown", removeTextBoxOnE);
                    resolve();
                }
            };
            addEventListener("keydown", removeTextBoxOnE);
        });
    }
}
