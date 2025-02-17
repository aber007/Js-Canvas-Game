import { displayTextBox } from "./text_functions.js";

export class Upgrades {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.visible = false;
    this.upgrades = {};
    this.upgrades["dmg1"] = {
      name: "Sharper balls",
      previous: "",
      unlocked: false,
      repurchase: false,
      level: 0,
      costgray: 1,
      costyellow: 0,
      costblue: 0,
      description: "Increase damage by 1",
      x: 0,
      y: 0,
    };
    this.upgrades["dmg2"] = {
      name: "Flaming hot balls",
      previous: "dmg1",
      unlocked: false,
      repurchase: false,
      level: 0,
      costgray: 1,
      costyellow: 0,
      costblue: 0,
      description: "Increase damage by 1",
      x : 0,
      y : 0,
    };
    this.upgrades["dmg3"] = {
      name: "Spiky balls",
      previous: "dmg2",
      unlocked: false,
      repurchase: false,
      level: 0,
      costgray: 1,
      costyellow: 0,
      costblue: 0,
      description: "Increase damage by 1",
      x : 0,
      y : 0,
    };
    this.upgrades["dmgpercent20"] = {
      name: "Soul sucking balls",
      previous: "dmg1",
      unlocked: false,
      repurchase: false,
      level: 0,
      costgray: 1,
      costyellow: 0,
      costblue: 0,
      description: "Deal 20% of enemy hp as damage",
      x : 0,
      y : 0,
    };
    this.upgrades["hp1"] = {
      name: "Health",
      previous: "",
      unlocked: false,
      repurchase: false,
      level: 0,
      costgray: 1,
      costyellow: 0,
      costblue: 0,
      description: "Increase health by 1",
      x : 0,
      y : 0,
    };
    this.upgrades["speed1"] = {
      name: "Speed",
      previous: "",
      unlocked: false,
      repurchase: false,
      level: 0,
      costgray: 1,
      costyellow: 0,
      costblue: 0,
      description: "Increase move speed by 1",
      x : 0,
      y : 0,
    };
    this.fixPositionOfUpgradeButons();
  }
  fixPositionOfUpgradeButons() {
    // Set level
    for (let [upgrade, value] of Object.entries(this.upgrades)) {
      let level = 0;
      let original = value;
      while (value.previous != "") {
        level += 1;
        value = this.upgrades[value.previous];
      }
      original.level = level;
    }
    // Find level with most upgrades
    let mostLevelsCheck = {};
    for (let [upgrade, value] of Object.entries(this.upgrades)) {
      if (mostLevelsCheck[value.level] == undefined) {
        mostLevelsCheck[value.level] = 1;
      } else {
        mostLevelsCheck[value.level] += 1;
      }
    }
    const highestVal = Math.max(...Object.values(mostLevelsCheck));
    let highestLevel = 0;
    for (let [level, value] of Object.entries(mostLevelsCheck)) {
      if (value == highestVal) {
        highestLevel = level;
      }
    }
    console.log("Level with most upgrades is " + highestLevel + " with " + highestVal + " upgrades");
    // Set x and y for each upgrade starting from highest level
    let i = 0;
    for (let [upgrade, value] of Object.entries(this.upgrades)) {
      value.x = 200 + 200 * value.level;
      if (value.level == highestLevel) {
        value.y = 200 + 150 * i;
        i++;
      }
    }

  } 



  showUpgradeShop(gray, yellow, blue) {
    
    const upgradebackground = document.createElement("div");
    upgradebackground.id = "upgradebackground";
    upgradebackground.className = "upgradebackground";

    // Create upgrade buttons (circular buttons)
    for (let [upgrade, value] of Object.entries(this.upgrades)) {
      const upgradebutton = document.createElement("button");
      upgradebutton.id = upgrade;
      upgradebutton.className = "upgradebutton";
      upgradebutton.style.top = value.y + "px";
      upgradebutton.style.left = value.x + "px";
      if (value.unlocked) {
        upgradebutton.style.border = "2px solid rgb(0, 255, 0)";
      }
      upgradebutton.innerHTML = value.name[0];
      upgradebutton.onclick = () => {
        // Check if previous upgrade is unlocked
        if (value.previous != "") {
          // Check if uprade can be bought
          if (!this.upgrades[value.previous].unlocked) {
            displayTextBox("You need to unlock " + this.upgrades[value.previous].name + " first!", 2000);
            return;
          }
        }
        if (gray >= value.costgray && yellow >= value.costyellow && blue >= value.costblue) {
          // Buy upgrade
          displayTextBox("Bought " + upgrade);
          upgradebutton.style.border = "2px solid rgb(0, 255, 0)";
        } else {
          displayTextBox("You need more coins to buy " + value.name + "!", 2000);
        }
      }
      // On hover
      upgradebutton.onmouseover = () => {
        // Show small box with description + cost
        const upgradebox = document.createElement("div");
        upgradebox.id = "upgradebox";
        upgradebox.className = "upgradedescription";
        upgradebox.style.top = value.y + "px";
        upgradebox.style.left = value.x + 120 + "px";
        upgradebox.innerHTML = "<u style='font-size: larger;'>" + value.name + ":</u><br>" + value.description + "<br><u style='font-size: larger;'>Cost:</u><br>Gray: " + value.costgray + "<br>Yellow: " + value.costyellow + "<br>Blue: " + value.costblue;        

        upgradebackground.appendChild(upgradebox);
      }
      upgradebutton.onmouseout = () => {
        upgradebutton.style.backgroundColor = "";
        upgradebackground.removeChild(document.getElementById("upgradebox"));
      }


      upgradebackground.appendChild(upgradebutton);
    }

    if (!this.visible) {
      console.log("Showing upgrade shop");
      this.visible = true;
      document.body.appendChild(upgradebackground);
    } else {
      console.log("Removing upgrade shop");
      this.visible = false;
      document.body.removeChild(document.getElementById("upgradebackground"));
    }
    
  }
}