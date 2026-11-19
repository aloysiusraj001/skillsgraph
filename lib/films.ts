import type { StageId } from "@/lib/domain";

export const FILM_IDS = ["scene", "stakeholders", "incident", "fish", "statement"] as const;

export type FilmId = (typeof FILM_IDS)[number];

export type FilmPart = { heading: string; paragraphs: string[] };

export type Film = {
  id: FilmId;
  number: number;
  title: string;
  gate: StageId;
  stages: StageId[];
  cue: string;
  parts: FilmPart[];
};

export function isFilmId(id: string): id is FilmId {
  return (FILM_IDS as readonly string[]).includes(id);
}

export const FILMS: Film[] = [
  {
    id: "scene",
    number: 1,
    title: "The chocolate bar",
    gate: "s0",
    stages: ["s0"],
    cue: "Play this first. It sets the scene. Leave Start until the next film has played too.",
    parts: [
      {
        heading: "The hidden world behind a chocolate bar",
        paragraphs: [
          "A chocolate bar hides the people who made it. On cocoa farms, families cut the pods, ferment the beans, and dry them. Children often do part of that work. Machetes, spray, and a scale the family does not control are part of the day. Rain can spoil beans that are drying outside.",
          "Buying agents, cooperatives, and chocolate makers sit between the farm and the shop. The farmer receives about 6 cents of each dollar spent on the bar.",
          "In this room you find the problem. You do not design a solution. You will name who it is for, find one real moment, trace why that moment happens, and write three problem statements the team can stand behind.",
        ],
      },
    ],
  },
  {
    id: "stakeholders",
    number: 2,
    title: "Who is in this, and who do we follow?",
    gate: "s0",
    stages: ["s0", "s1", "s1b", "s2"],
    cue: "Play this after the chocolate-bar film, then press Start.",
    parts: [
      {
        heading: "People",
        paragraphs: [
          "A stakeholder is a person or a group this situation touches. Add a short label, such as caretaker or year group. Leave products and solutions off the board.",
          "Work in silence until the teacher ends the time. Three cards each is the aim. Fewer cards do not stop the room. Others cannot see your cards until the time ends.",
        ],
      },
      {
        heading: "Merge",
        paragraphs: [
          "Stack cards that name the same person. Do not retype them. Only the Theme Mapper merges, by dragging one card onto the other. Anyone else can suggest a pair. The Devil's Advocate can stop one bad merge.",
          "The duty teacher and the coach are different people, even if both are adults. When the pile is clean, the Theme Mapper taps Merges done.",
        ],
      },
      {
        heading: "Matrix",
        paragraphs: [
          "The Theme Mapper places every card. Power is how much they can change what happens. Interest is how much they care. The four corners are Work closely, Keep satisfied, Keep involved, and Monitor.",
          "The Lead Interviewer taps the one person the team will follow and writes what goes wrong for that person. That sentence is the early guess. There is no vote. The Insight Extractor can mark daily pain. The Devil's Advocate looks for a missing blocker and for guesses treated as facts.",
          "In a football example, the team follows the student who brought the ball. The caretaker has the key and may not care about the game. The student cares and cannot open the shed. Your cards are about the chocolate bar, not the football.",
        ],
      },
    ],
  },
  {
    id: "incident",
    number: 3,
    title: "Talk to them, then pick one moment",
    gate: "s2",
    stages: ["s3"],
    cue: "Play this when the person is chosen, then press Next.",
    parts: [
      {
        heading: "Why talk to them",
        paragraphs: [
          "You have a person. You do not yet have a moment. The short interview is a faster version of a longer conversation. The team asks. That person answers. Read what they are trying to get done, what gets in the way, and one moment with a when and a where.",
          "The person speaks as someone who does this work. They use real seasons, prices, and what actually went wrong. It is not a recording of one visit.",
        ],
      },
      {
        heading: "Who can ask",
        paragraphs: [
          "Only the Lead Interviewer types extra questions. Everyone else reads the answers as they arrive. Eight questions is the limit. Ask about their day. Do not ask them to choose your solution.",
        ],
      },
      {
        heading: "One incident",
        paragraphs: [
          "Write one fact that happened, with a when, a where, and a what. On Thursday at outdoor break, the ball was still in the shed when the whistle went is an incident. They are careless is not. The Devil's Advocate can reject blame.",
          "Vote for one incident. The winner is the core problem. It goes in the head of the fish.",
        ],
      },
    ],
  },
  {
    id: "fish",
    number: 4,
    title: "The fish, one rib, the root, the pin",
    gate: "s3",
    stages: ["s4a", "s4b", "s4c", "s4d"],
    cue: "Play this when one incident is chosen, then press Next.",
    parts: [
      {
        heading: "Causes",
        paragraphs: [
          "The incident is the head of the fish. Each rib is one kind of cause: Timing, Communication, Perceived value, Process, Tools, and Environment. Pick a rib, write why the incident happened, and add the card.",
          "The Theme Mapper moves a card that is on the wrong rib. Do not choose a root yet, and do not write a solution.",
        ],
      },
      {
        heading: "One rib",
        paragraphs: [
          "Read the cause on each rib. Tap the one rib the team will follow. The Whys grow on that rib only.",
        ],
      },
      {
        heading: "Why",
        paragraphs: [
          "Only the Insight Extractor adds a Why. Each answer sits further left. Tag it Evidence, Assumption, or Need to check. Stop when one answer is the root cause. That is often the third or the fourth Why. Tap it and mark it. You do not have to write a fifth.",
        ],
      },
      {
        heading: "Pin",
        paragraphs: [
          "The Insight Extractor checks two labels. Obstacle is the cause on the rib. Insight is the Why marked as the root. The Theme Mapper places the pin. The incident stays in the head. It is not the obstacle and it is not the insight.",
          "In the football example the rib is Tools. The obstacle is the single key that leaves with the caretaker. The root is that lock-up happens before break. Your fish is about the chocolate bar.",
        ],
      },
    ],
  },
  {
    id: "statement",
    number: 5,
    title: "One sentence, then three keepers",
    gate: "s4d",
    stages: ["s5", "s6", "s7"],
    cue: "Play this when the pin is on the fish, then press Next.",
    parts: [
      {
        heading: "Write",
        paragraphs: [
          "The sentence is: who needs need, but obstacle, so harm, because insight.",
          "Who is the person you followed. Need starts from the interview line about what they are trying to get done. Edit it so it is a human need, not a product. Obstacle is the cause you pinned. Harm is the incident in the fish head. Insight is the Why marked as the root cause.",
          "Change a blank that is wrong. Submit your own sentence, then wait for the other four.",
        ],
      },
      {
        heading: "Choose 3",
        paragraphs: [
          "The Devil's Advocate tags weak sentences. The Insight Extractor can propose a fix. You accept a fix only on your own card. The Theme Mapper stacks duplicates. When the Leader opens the vote, you have two votes. The team keeps three sentences.",
          "A football sentence shows the shape: The student who brought the ball needs to get a game going before break ends, but there is one key and it leaves with the caretaker, so on Thursday the ball was still in the shed when the whistle went, because the lock-up round is scheduled before break.",
          "Your sentences are about the chocolate bar, not about the football.",
        ],
      },
    ],
  },
];

export function filmsForStage(stage: StageId) {
  return FILMS.filter((film) => film.stages.includes(stage));
}

export function gateFilms(stage: StageId) {
  return FILMS.filter((film) => film.gate === stage);
}
