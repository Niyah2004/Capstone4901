export const AVATARS = {
    panda: {
        base: require("../assets/panda.png"),
        accessories: {
            sleepmask: {
                image: require("../assets/panda/accessories/sleepmask.png"),
                cost: 10,
                position: { top: -15, left: 42, size: 230 },
            },
        },
        hats: {
            hat: {
                image: require("../assets/panda/hats/hat.png"),
                cost: 10,
                position: { top: -63.4, left: 63.9, size: 200 },
            },
        },
        pants: {
            pant: {
                image: require("../assets/panda/pants/pant.png"),
                cost: 20,
                position: { top: 185, left: 83.1, size: 134.9 },
            },
        },
        shoes: {
            slippers: {
                image: require("../assets/panda/shoes/slippers.png"),
                cost: 15,
                position: { top: 213, left: 82, size: 135 },
            },
        },
        tops: {
            hoodie: {
                image: require("../assets/panda/tops/hoodie.png"),
                cost: 15,
                position: { top: 137, left: 74.6, size: 148.9 },
            },
            top: {
                image: require("../assets/panda/tops/top.png"),
                cost: 15,
                position: { top: 130, left: 75, size: 147 },
            }
        },
    },

    turtle: {
        base: require("../assets/turtle.png"),
        accessories: {
            turtle_mask: {
                image: require("../assets/turtle/accessories/turtle_mask.png"),
                cost: 1000,
                position: { top: -43, left: -37, size: 375 },
            },
        },
    },
    dino: {
        base: require("../assets/dino.png"),
        accessories: {
            dog: {
                image: require("../assets/dino/accessories/dinoDog.png"),
                cost: 10,
                position: { top: 190, left: 188, size: 130 },
            },
            scarf: {
                image: require("../assets/dino/accessories/dinoScarf.png"),
                cost: 10,
                position: { top: 160, left: 97, size: 110 },
            },
        },
        hats: {
            hat: {
                image: require("../assets/dino/hats/dinoHat.png"),
                cost: 20,
                position: { top: -50, left: 54, size: 200 },
            },
        },
        shoes: {
            sneakers: {
                image: require("../assets/dino/shoes/dinoSkates.png"),
                cost: 15,
                position: { top: 213, left: 85, size: 135 },
            },
        },
    },
    //   lion: {
    //     base: require("../assets/lion.png"),
    //     hats: {
    //       crown: {
    //         image: require("../assets/lion/hats/crown.png"),
    //         cost: 20,
    //         position: { top: -70, left: 75, size: 180 },
    //       },
    //     },
    //   },
    //   penguin: {
    //     base: require("../assets/penguin.png"),
    //     hats: {
    //       cap: {
    //         image: require("../assets/penguin/hats/cap.png"),
    //         cost: 5,
    //         position: { top: -25, left: 60, size: 140 },
    //       },
    //     },
    //   },
};
