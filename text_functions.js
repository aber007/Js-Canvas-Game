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


export async function displayTextBox(text, duration = 0) {
    // Remove any existing text boxes
    const textBoxes = document.getElementsByClassName("text-box");
    for (let textBox of textBoxes) {
      document.body.removeChild(textBox);
    }
    const textBox = document.createElement("div");
    textBox.className = "text-box";
    textBox.style.position = "absolute";
    textBox.style.width = "300px";
    textBox.style.zIndex = "10";
    textBox.style.top = "100px";
    textBox.style.left = "50%";
    textBox.style.padding = "40px";
    textBox.style.transform = "translateX(-50%)";
    textBox.style.padding = "10px";
    textBox.style.backgroundColor = "rgba(234, 212, 170, 1)";
    textBox.style.color = "black";
    textBox.style.border = "1px solid rgba(184,111,80,1)";
    textBox.style.borderRadius = "5px";
    textBox.style.zIndex = "1000";
    textBox.style.fontSize = "20px";
    textBox.style.fontFamily = "Pixelify Sans";
    textBox.style.fontOpticalSizing = "auto";
    textBox.style.whiteSpace = "pre-wrap";
    textBox.innerText = "";

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
            console.log("Error removing text box, probably already removed");
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