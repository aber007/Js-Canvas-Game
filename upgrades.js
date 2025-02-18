import { displayTextBox } from "./text_functions.js";
import { upgrades } from "./upgradevalues.js";

export class Upgrades {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.visible = false;
    this.upgrades = upgrades;
    

    this.lines = {};
    this.fixPositionOfUpgradeButons();
  }
  fixPositionOfUpgradeButons() {
    // Set level
    for (let value of Object.values(this.upgrades)) {
      let level = 0;
      let original = value;
      while (value.previous != "") {
        level += 1;
        value = this.upgrades[value.previous];
      }
      original.level = level;
    }
    let trees = {};
    for (let value of Object.values(this.upgrades)) {
      const original = value;
      while (value.previous != "") {
        value = this.upgrades[value.previous];
      }
      if (trees[value.id] == undefined) {
        trees[value.id] = [];
        trees[value.id].push(original);
      } else {
        trees[value.id].push(original);
      }
    }
    // Get amount of upgrades in each level of each tree
    for (let i = 0; i < Object.keys(trees).length; i++) {
      let tree = trees[Object.keys(trees)[i]];
      for (let upgrade of tree) {
        let level = upgrade.level;
        let amount = 0;
        for (let upgrade2 of tree) {
          if (upgrade2.level == level) {
            amount += 1;
          }
        }
        upgrade.amount = amount;
      }
    }
    // Set x and y
    for (let i = 0; i < Object.keys(trees).length; i++) {
      let tree = trees[Object.keys(trees)[i]];
      // Sort tree by level
      tree.sort((a, b) => a.level - b.level);

      for (let upgrade of tree) {
        upgrade.x = upgrade.level * 120;
        const defaulty = 200;
        if (upgrade.amount > 1) {
          // create a new subtree only containing upgrades of the same level
          let subtree = [];
          for (let upgrade2 of tree) {
            if (upgrade2.level == upgrade.level) {
              subtree.push(upgrade2);
            }
          }
          // Find first common ancestor
          let commonAncestor = upgrade;
          while (commonAncestor.previous != "") {
            commonAncestor = this.upgrades[commonAncestor.previous];
          }
          const levelHeight = 120 * subtree.length;
          upgrade.y =
            commonAncestor.y +
            50 -
            levelHeight / 2 +
            subtree.indexOf(upgrade) * 120;
        } else {
          if (upgrade.level == 0) {
            // set starting y value
            switch (upgrade.id) {
              case "dmg1":
                upgrade.y = defaulty;
              break;
              case "hp1":
                upgrade.y = defaulty * 2.8;
                break
              case "speed1":
                upgrade.y = defaulty * 4.6;
                break
              default:
                upgrade.y = defaulty;
            }
          } else {
            // inherit y from previous upgrade
            upgrade.y = this.upgrades[upgrade.previous].y;
          }
        }
        upgrade.x += 50;
      }
    }
  }

  showUpgradeShop(game) {
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

      if (value.previous != "") {
        // Adding lines to indicate where next upgrade is
        const previousUpgrade = this.upgrades[value.previous];
        const line = document.createElement("div");
        line.className = "upgrade-line";
        const buttonSize = 100;
        const x1 = value.x + buttonSize / 2;
        const y1 = value.y + buttonSize / 2;
        const x2 = previousUpgrade.x + buttonSize / 2;
        const y2 = previousUpgrade.y + buttonSize / 2;
        const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
        line.style.position = "absolute";
        line.style.backgroundColor = value.unlocked
          ? "rgb(0, 255, 0)"
          : "rgb(255, 0, 0)";
        line.style.zIndex = "1";
        line.style.width = length + "px";
        line.style.height = "2px";
        line.style.transform = `rotate(${angle}deg)`;
        line.style.top = y1 + "px";
        line.style.left = x1 + "px";
        line.style.transformOrigin = "0 0";
        upgradebackground.appendChild(line);

        // Store reference to the line
        this.lines[upgrade] = line;
      }

      upgradebutton.onclick = () => {
        // Check if previous upgrade is unlocked
        if (value.unlocked) {
          return;
        }
        if (value.previous != "") {
          // Check if uprade can be bought
          if (!this.upgrades[value.previous].unlocked) {
            displayTextBox(
              "You need to unlock " +
                this.upgrades[value.previous].name +
                " first!",
              2000
            );
            return;
          }
        }
        if (
          game.gray >= value.costgray &&
          game.yellow >= value.costyellow &&
          game.blue >= value.costblue
        ) {
          // Buy upgrade
          game.gray -= value.costgray;
          game.yellow -= value.costyellow;
          game.blue -= value.costblue;
          value.unlocked = true;
          displayTextBox("Bought " + value.name + "!", 2000);
          upgradebutton.style.border = "2px solid rgb(0, 255, 0)";

          // Update line color
          if (this.lines[upgrade]) {
            this.lines[upgrade].style.backgroundColor = "rgb(0, 255, 0)";
          }
        } else {
          displayTextBox(
            "You need more coins to buy " + value.name + "!",
            2000
          );
        }
      };
      // On hover
      upgradebutton.onmouseover = () => {
        // Show small box with description + cost
        const upgradebox = document.createElement("div");
        upgradebox.id = "upgradebox";
        upgradebox.className = "upgradedescription";
        upgradebox.style.top = value.y + "px";
        upgradebox.style.left = value.x + 120 + "px";
        upgradebox.innerHTML =
          "<u style='font-size: larger;'>" +
          value.name +
          ":</u><br>" +
          value.description +
          "<br><u style='font-size: larger;'>Cost:</u><br>Gray: " +
          value.costgray +
          "<br>Yellow: " +
          value.costyellow +
          "<br>Blue: " +
          value.costblue;

        upgradebackground.appendChild(upgradebox);
      };
      upgradebutton.onmouseout = () => {
        upgradebutton.style.backgroundColor = "";
        upgradebackground.removeChild(document.getElementById("upgradebox"));
      };

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
