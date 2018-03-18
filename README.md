# The Subway Game
---
## Flavor Text
The year is 1898. The City of New York just consolidated, and needed to link the boroughs. Boston had just won the subway wars, opening the Tremont Street Subway the year before, and New York needed to catch up fast.

To quickly get rapid transit, the City gave the rights to two companies, the IRT (Interborough Rapid Transit) and BRT (Brooklyn Rapid Transit) to build competing subway systems.

Your job, as the heads of those transit corporations: outbuild the other one, and win over the ticket sales of the millions of commuters.

## The pieces
 * A game board, with some number of rectangular sections, each with the same number of squares in each row and column
 * Three card sections - corresponding to the sections, rows, and columns - each with the piles of cards that are not in the deck, the draw deck, the discard deck, an indicator of flips, and a queue
 * Piles of pieces
 * A place to keep track of points

## Turn order
Each player takes turns, going in a circle. A turn consists of:

 1. Populating the city
 2. Taking trips
 3. A build phase
 4. Moving on to the next person's turn

## Populating the city
 1. Randomly pick a section, row, and column. Put those cards into their respective discard piles, if they are not at max population.
 2. Fill the queues up to the number of flips that pile has done. It starts at 0, so you don't fill at first. If you run out of cards, the picking stops. If there are no cards in the draw pile, shuffle the discard pile, and increase the number of flips by 1.

## Taking Trips
 1. Take the first two cards in each queue, if all three queues have at least two cards in them. Take a trip from the first to the second. Repeat until you cannot take another trip.
 2. The distance is number of squares "walked" + number of stations in each subway ride, where walking out of a hazard square is 2 steps rather than 1. (You can count it also only going in, but be consistent.) So, a trip from 0 to 10, where there are connected subway stops at 3,6, and 8 is 8 distance (walked 3 from 0 to 3, took a subway ride from 3 to 8 via 6 (3 distance), and 2 distance from 8 to 10). A subway intersection (a square with 3 neighbors of the same color as it) also adds distance as if it were a stop (even if there is no stop there). Currently, a stop with 2 subway systems on it counts for each of the systems you take in it. So, if Blue's subway goes from 0 to 4, and Red's goes from 4 to 8, the distance from 0 to 8 is 4, not 3.
 3. If a station is not local, it can not only go to the next stations on the path, but also "skip over" local stations to the next non-local station.
 4. Choose the shortest distance path. If there are multiple ones, choose the one with the fewest modes of transportation. If there are multiple of these paths, the person whose turn it is chooses the winner.
 5. If the winning path uses 1 person's subway system, they get 2 points. If there are multiple systems, everyone gets 1 point.
 6. If the trip is shorter than a specified amount (which you choose), then you can intensify the row, column, or section that the end of the trip is in. You intensify by putting a card of that type in the discard pile.

## Build Phase

You have a specified number of builds per turn, which you determine at the start. Each of building a station, removing a station, removing a track, building a track in normal terrain, or intensifying a space is one build. Building a track in hazardous terrain or where someone else has already built track uses your whole build phase.

When you build a station or intensify a square, take an extra trip using that station as a starting point. The ending uses the first thing in the queue if it can, or the top card of the draw deck if it can't. This is how you introduce the first shuffle into the game.

---
# Questions for Testers
 * Is everything balanced well? Should people have more builds per turn? If that is expanded, should some builds take 3 and others 2?
 * Do you like the way the distances are counted? Should there be transfers? Do you like that you only do the extra hazard space when leaving?
 * As of now, the game has no ending condition. I was thinking once a certain number of piles are depleted, you end the game. Do you have other ideas?
 * If you have played around with the settings, are there any you really like? A certain number of squares, a certain configuration of hazard spaces?
 * Do you like the number of trips taken? Would you like it to be faster, and queue starts, but draw the destinations?
 * Would you like it to show who the winner is more clearly, or what path the trip took?
 * I am thinking about adding something if you build in a populated space. For example, any build in it depopulates the square, or is harder to build in it?
 * Should there be any way to change the end a turn early? Do you get cash? Pay for an extra turn? Shunt your extra build to a later turn? Steal a turn from later you? If you do that, do you get a token that blocks a build until you spend a build getting rid of it?
 * To slow down adding random squares, do you only choose one of the three piles on the add in phase?
 * Is there any feature that you might like to see that I don't have, or haven't mentioned?
 * Would you be happy simplifying the cards to two piles, one for section and one for where within that section?
 * What can I make clearer about these rules?
