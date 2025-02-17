import { displayTextBox } from "./text_functions.js";

export class Upgrades {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.visible = false;
    this.upgrades = {};
    this.upgrades["dmg1"] = {
      name: "Sharper balls",
      id: "dmg1",
      previous: "",
      unlocked: false,
      repurchase: false,
      costgray: 1,
      costyellow: 0,
      costblue: 0,
      description: "Increase damage by 1",
      x: 0,
      y: 0,
    };
    this.upgrades["dmg2"] = {
      name: "Flaming hot balls",
      id: "dmg2",
      previous: "dmg1",
      unlocked: false,
      repurchase: false,
      costgray: 1,
      costyellow: 0,
      costblue: 0,
      description: "Increase damage by 1",
      x: 0,
      y: 0,
    };
    this.upgrades["dmg3"] = {
      name: "Spiky balls",
      id: "dmg3",
      previous: "dmg2",
      unlocked: false,
      repurchase: false,
      costgray: 1,
      costyellow: 0,
      costblue: 0,
      description: "Increase damage by 1",
      x: 0,
      y: 0,
    };
    this.upgrades["dmgpercent20"] = {
      name: "Soul sucking balls",
      id: "dmgpercent20",
      previous: "dmg1",
      unlocked: false,
      repurchase: false,
      costgray: 1,
      costyellow: 0,
      costblue: 0,
      description: "Deal 20% of enemy hp as damage",
      x: 0,
      y: 0,
    };
    // this.upgrades["test1"] = {
    //   name: "test1",
    //   id: "test1",
    //   previous: "dmgpercent20",
    //   unlocked: false,
    //   repurchase: false,
    //   costgray: 1,
    //   costyellow: 0,
    //   costblue: 0,
    //   description: "Deal 20% of enemy hp as damage",
    //   x: 0,
    //   y: 0,
    // };
    // this.upgrades["test2"] = {
    //   name: "test2",
    //   id: "test2",
    //   previous: "dmgpercent20",
    //   unlocked: false,
    //   repurchase: false,
    //   costgray: 1,
    //   costyellow: 0,
    //   costblue: 0,
    //   description: "Deal 20% of enemy hp as damage",
    //   x: 0,
    //   y: 0,
    // };
    this.upgrades["hp1"] = {
      name: "Health",
      id: "hp1",
      previous: "",
      unlocked: false,
      repurchase: false,
      costgray: 1,
      costyellow: 0,
      costblue: 0,
      description: "Increase health by 1",
      x: 0,
      y: 0,
    };
    this.upgrades["hp2"] = {
      name: "Health",
      id: "hp2",
      previous: "hp1",
      unlocked: false,
      repurchase: false,
      costgray: 1,
      costyellow: 0,
      costblue: 0,
      description: "Increase health by 1",
      x: 0,
      y: 0,
    };
    this.upgrades["coffin"] = {
      name: "Health",
      id: "coffin",
      previous: "hp1",
      unlocked: false,
      repurchase: false,
      costgray: 1,
      costyellow: 0,
      costblue: 0,
      description: "Increase health by 1",
      x: 0,
      y: 0,
    };
    this.upgrades["speed1"] = {
      name: "Speed",
      id: "speed1",
      previous: "",
      unlocked: false,
      repurchase: false,
      costgray: 1,
      costyellow: 0,
      costblue: 0,
      description: "Increase move speed by 1",
      x: 0,
      y: 0,
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
    let trees = {};
    for (let [upgrade, value] of Object.entries(this.upgrades)) {
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
        const defaulty = 120;
        if (upgrade.amount > 1) {
          // create a new subtree only containing upgrades of the same level
          let subtree = [];
          for (let upgrade2 of tree) {
            if (upgrade2.level == upgrade.level) {
              subtree.push(upgrade2);
            }
          }
          const levelHeight = 120 * subtree.length;
          upgrade.y =
            this.upgrades[upgrade.previous].y +
            50 -
            levelHeight / 2 +
            subtree.indexOf(upgrade) * 120;
        } else {
          if (upgrade.level == 0) {
            // set starting y value
            let maxY = 0;
            for (let upgrade3 of Object.values(this.upgrades)) {
              console.log(upgrade3.name + "Should has Y of: " + upgrade3.y)
              if (upgrade3.y > maxY) {
                maxY = upgrade3.y + 120;
              }
            }
            console.log("Upgrade " + upgrade.name + "Should be on " + maxY);
            upgrade.y = defaulty + maxY;
          } else {
            // inherit y from previous upgrade
            upgrade.y = this.upgrades[upgrade.previous].y;
          }
        }
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
          gray >= value.costgray &&
          yellow >= value.costyellow &&
          blue >= value.costblue
        ) {
          // Buy upgrade
          displayTextBox("Bought " + upgrade);
          upgradebutton.style.border = "2px solid rgb(0, 255, 0)";
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
