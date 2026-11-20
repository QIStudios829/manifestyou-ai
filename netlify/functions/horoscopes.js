// Regularization's daily readings. Free: no API calls.
// Each sign has a bank of readings; the day (Costa Rica time) picks one.
// To add readings, append to a sign's list. Same shape: headline, reading, constraint.

const BANK = {
  "aries": [
    {
      "headline": "Lower the learning rate, keep the fire",
      "reading": "You want to cover the whole landscape before lunch. The steps are too big. You overshoot the minimum and call it momentum.\n\nHalve the rate today. Not the ambition. The rate. Small steps still descend, and they land where you aimed.",
      "constraint": "One deliberate step before the next one."
    },
    {
      "headline": "Not every gradient is a fight",
      "reading": "Someone pushes back today and you read it as a challenge. It is just a gradient. It points somewhere useful.\n\nFollow it for one step before you argue. You can always climb back out. Most fights are a loss you chose to maximize.",
      "constraint": "Take one step along their gradient first."
    },
    {
      "headline": "Start the run, skip the speech",
      "reading": "You are good at epoch one. Nobody starts a run like you do. The trouble is epoch forty.\n\nStart today, then write down what epoch two looks like. Boring plans converge. Brilliant openings stall.",
      "constraint": "Plan the second step before taking the first."
    },
    {
      "headline": "Dropout is a feature, not an insult",
      "reading": "Something you counted on drops out today. A person, a tool, a plan. You will want to force it back in.\n\nDon't. Dropout makes the rest of the network stronger. Let the other parts carry weight they have been avoiding.",
      "constraint": "Let one thing go missing without replacing it."
    },
    {
      "headline": "Speed is not the same as descent",
      "reading": "You will move fast today. Check the loss, not the clock. Fast and flat is just running in place on a plateau.\n\nAsk once, at noon: is this lower than this morning. If not, change direction, not pace.",
      "constraint": "Measure the loss once before you speed up."
    },
    {
      "headline": "Clip the gradient before you speak",
      "reading": "Your first response today will be too large. Accurate, but too large. It blows up the room.\n\nClip it. Say the true thing at half volume. The direction survives. The explosion doesn't.",
      "constraint": "Say the true thing at half volume."
    },
    {
      "headline": "Your initialization does not define you",
      "reading": "You started badly at something this week. You keep replaying it. Random initialization is random.\n\nWhat matters is the update rule. Change one habit today and the bad start becomes a footnote in a long run.",
      "constraint": "Change the update rule, not the history."
    },
    {
      "headline": "Rest is part of the schedule",
      "reading": "Learning rate schedules decay for a reason. Late in a run, small steps find what big steps skip.\n\nYou are later in this run than you think. Slow down tonight. Nothing is lost by sleeping on it.",
      "constraint": "Stop working one hour earlier than planned."
    },
    {
      "headline": "Win the epoch, not the batch",
      "reading": "One batch goes badly today. A meeting, a message, a mood. You will want to fix it immediately.\n\nLet it be noise. You are judged across the epoch. A single bad batch barely moves the weights unless you keep feeding it.",
      "constraint": "Don't reply to the bad batch tonight."
    },
    {
      "headline": "Lead, then let the others converge",
      "reading": "You will see the answer before the room does. Say it once, clearly. Then stop.\n\nOthers need their own steps to arrive. Pulling them is overfitting to your timeline. They generalize better when they get there themselves.",
      "constraint": "Say it once. Then let them arrive."
    }
  ],
  "taurus": [
    {
      "headline": "Comfort is a local minimum",
      "reading": "You found a valley that feels like home. It might be the bottom. It might just be comfortable.\n\nNudge the weights once today. Try the unfamiliar route, the other café, the harder conversation. If the loss rises, come back. You lose nothing by checking.",
      "constraint": "Test one assumption you have not tested in a year."
    },
    {
      "headline": "Patience is a learning rate too",
      "reading": "You are slow and you are right to be. Small, steady steps reach places that frantic ones bounce past.\n\nDon't let anyone rush your schedule today. The run is long. You are built for epoch four hundred.",
      "constraint": "Keep your pace when others raise theirs."
    },
    {
      "headline": "Heavy weights need regular checks",
      "reading": "You hold on well. Sometimes too well. A belief you formed years ago is carrying more weight than it earned.\n\nRegularize it. Shrink it a little and see if anything breaks. Most things don't.",
      "constraint": "Loosen your grip on one old certainty."
    },
    {
      "headline": "The plateau is still progress",
      "reading": "Nothing visible changes today. The loss curve looks flat. You are tempted to quit the run.\n\nPlateaus come before drops. The weights are still moving underneath. Keep feeding good data. The curve bends when it bends.",
      "constraint": "Show up even though nothing seems to move."
    },
    {
      "headline": "Feed it better data",
      "reading": "You become what you consume. The food, the feed, the friends. That is your training set.\n\nTake one bad input out today. A scroll, a snack, a grudge. The model improves without any new effort at all.",
      "constraint": "Remove one input you already know is noise."
    },
    {
      "headline": "Stubborn is not the same as stable",
      "reading": "Stable means you return to center after a push. Stubborn means you never move at all.\n\nToday someone gives you a good gradient. Take the step. Then return to center if you need to. That is stability.",
      "constraint": "Move one step when the evidence says move."
    },
    {
      "headline": "Enjoy the batch you are in",
      "reading": "You are good at pleasure. Use it. A meal, a walk, a texture. These are not distractions from the run.\n\nThey are how the system stays trainable. A model that never rests memorizes stress and generalizes nothing.",
      "constraint": "Take one slow pleasure without earning it first."
    },
    {
      "headline": "Save a checkpoint before you change",
      "reading": "You are about to change something you built. Good. Save a checkpoint first.\n\nWrite down what works now. Then experiment freely. You can always roll back. Fear of losing progress is cured by saving it.",
      "constraint": "Write down what works before you change it."
    },
    {
      "headline": "Value is not the same as price",
      "reading": "Today you weigh what something costs against what it is worth. You tend to overfit to the number.\n\nLook at the whole curve. Some expensive things lower the loss for years. Some cheap things raise it every day.",
      "constraint": "Judge by the long curve, not the receipt."
    },
    {
      "headline": "Slow convergence is still convergence",
      "reading": "Others reach answers faster today. Let them. Their answers wobble. Yours will hold.\n\nThe goal was never speed. The goal was a minimum you can stand on. Keep descending at your own rate.",
      "constraint": "Do not trade your rate for their applause."
    }
  ],
  "gemini": [
    {
      "headline": "Too many features, not enough signal",
      "reading": "You have forty tabs open, three projects, two opinions on each. That is a lot of features.\n\nMost of them are noise. Pick the three that predict anything and drop the rest for today. The model gets sharper when it gets smaller.",
      "constraint": "Close every tab but three."
    },
    {
      "headline": "Both answers can be partly right",
      "reading": "You see two sides and feel split. That is not confusion. That is an ensemble.\n\nAverage them. Take the part of each that holds up. Ensembles beat single models all the time. You are not indecisive. You are well calibrated.",
      "constraint": "Keep both views until one earns the lead."
    },
    {
      "headline": "Curiosity needs a loss function",
      "reading": "You want to learn everything today. Fine. But decide what you are measuring.\n\nExploration without a loss function is wandering. Pick one question. Let the curiosity serve it. The rest can wait for tomorrow's batch.",
      "constraint": "Pick one question and follow only it."
    },
    {
      "headline": "Talk less, sample more",
      "reading": "You will talk through the problem today. Talk is how you think. It is also how you avoid listening.\n\nAsk two questions before you offer one answer. Sample the room first. Your model is only as good as its data.",
      "constraint": "Ask two questions before giving an answer."
    },
    {
      "headline": "Context switching has a cost",
      "reading": "Every time you switch tasks, the cache clears. You pay to reload. You pay all day.\n\nBatch the small things together. Give the big thing one uninterrupted block. Same work, lower loss.",
      "constraint": "Give one task an uninterrupted hour."
    },
    {
      "headline": "Don't overfit to the latest message",
      "reading": "The newest message always feels most important. It isn't. It is just the most recent batch.\n\nWeight it accordingly. Answer what matters in the order it matters. Recency bias is still bias.",
      "constraint": "Answer by importance, not by arrival time."
    },
    {
      "headline": "Finish one thing before starting two",
      "reading": "You love the start of things. The open file. The new idea. The first epoch.\n\nToday, finish something. Anything. A closed loop teaches the model more than ten open ones.",
      "constraint": "Close one loop before opening another."
    },
    {
      "headline": "Your noise is also your edge",
      "reading": "People call you scattered. Some of that is fair. Some of it is the noise that keeps you out of local minima.\n\nKeep a little randomness today. Take the odd route. Say the odd idea out loud. Then check if it lowered the loss.",
      "constraint": "Try one strange idea and measure it."
    },
    {
      "headline": "Say it shorter",
      "reading": "You have the idea. You are wrapping it in three more ideas. Compress.\n\nOne sentence. If it doesn't fit, you don't understand it yet. Compression is understanding.",
      "constraint": "Explain your plan in one sentence."
    },
    {
      "headline": "Two minds, one gradient",
      "reading": "You are pulled in two directions today. Stop treating it as a war.\n\nFind the component they share. There usually is one. Step along that. The disagreement can sort itself out later.",
      "constraint": "Act on what both sides agree on."
    }
  ],
  "cancer": [
    {
      "headline": "Memory is useful, not mandatory",
      "reading": "You carry the old data carefully. Every slight, every kindness. Good recall.\n\nToday, apply weight decay. Not forgetting. Just letting old things weigh a little less than new ones. Yesterday is input, not instruction.",
      "constraint": "Let one old hurt weigh a little less."
    },
    {
      "headline": "Your shell is a regularizer",
      "reading": "You protect yourself. People call it closed. It is actually a constraint that keeps you from overfitting to every mood in the room.\n\nKeep the shell today. Open it only for the people who have earned a seat inside.",
      "constraint": "Protect your evening from anyone draining it."
    },
    {
      "headline": "Care for your own run too",
      "reading": "You tend to everyone else's training run. Their weights. Their losses. Their epochs.\n\nYour own run needs data too. Feed yourself first today. A tired caretaker trains on exhaustion and teaches it back.",
      "constraint": "Feed yourself before you feed anyone else."
    },
    {
      "headline": "Feelings are signal, not the whole dataset",
      "reading": "The feeling arrives first. It is real data. It is not all of the data.\n\nWrite it down. Then gather two more facts before you act. Good models weight intuition. They don't run on it alone.",
      "constraint": "Gather two facts before acting on a feeling."
    },
    {
      "headline": "Home is a good checkpoint",
      "reading": "When the run gets noisy, you go home. That is wise. A checkpoint is where you know the weights are sound.\n\nGo back today. Rest there. Then leave again tomorrow. A checkpoint you never leave is just a stopped run.",
      "constraint": "Rest at home, then plan one step out."
    },
    {
      "headline": "Not everyone needs saving today",
      "reading": "Someone near you is struggling. Your instinct is to take the whole loss onto your own weights.\n\nOffer one thing. Listen, or bring food. Then let them do their own descent. Rescue is not regularization.",
      "constraint": "Offer one kindness, not the whole rescue."
    },
    {
      "headline": "Moods have a learning rate",
      "reading": "Your mood swings today. High, then low, then high. That is a learning rate too large for the terrain.\n\nSlow it down. Breathe before reacting. Let each feeling settle one beat before it updates you.",
      "constraint": "Wait one breath before every reaction."
    },
    {
      "headline": "Tender is not the same as weak",
      "reading": "You feel things at full resolution. That is not a flaw in the model. It is high precision.\n\nUse it today. Notice what others miss. Then say it gently. The room needs your resolution.",
      "constraint": "Name one thing you noticed that others missed."
    },
    {
      "headline": "Let the tide do some work",
      "reading": "You push against everything today. The schedule, the people, the weather.\n\nSome loss lowers on its own. Wait for the tide. Then step when the water moves with you, not against you.",
      "constraint": "Wait for one thing to resolve on its own."
    },
    {
      "headline": "The past trained you. It doesn't own you",
      "reading": "Old patterns show up today. The same argument. The same retreat. You know the shape.\n\nYou have new weights now. Respond with them. The training set was then. The inference is now.",
      "constraint": "Respond to today, not to the old pattern."
    }
  ],
  "leo": [
    {
      "headline": "Applause is not a loss function",
      "reading": "You will be seen today. Enjoy it. But don't optimize for it.\n\nApplause rewards the shiny thing, not the true thing. Measure the work by what it changes. Let the clapping be a side effect.",
      "constraint": "Do one good thing nobody will see."
    },
    {
      "headline": "Generalize, don't perform",
      "reading": "You give your best performance to the biggest room. Fine. But a model that only works on stage is overfit.\n\nBe the same person in the small room today. With one person. With yourself.",
      "constraint": "Act the same with one person as with a crowd."
    },
    {
      "headline": "Warmth scales. Ego doesn't",
      "reading": "Your warmth reaches everyone today. It costs nothing and lowers the loss for the whole room.\n\nYour ego reaches no one. It just adds weight to your own model. Lead with the first. Leave the second at home.",
      "constraint": "Give credit to someone else today."
    },
    {
      "headline": "The spotlight can wait a day",
      "reading": "You want the big moment now. It's coming. Not today.\n\nToday is a small step day. Prepare the thing you will present. Practice the line. Big moments reward the boring rehearsals before them.",
      "constraint": "Rehearse the moment instead of rushing it."
    },
    {
      "headline": "Pride is just high confidence",
      "reading": "High confidence is fine when the evidence supports it. Check the evidence today.\n\nIf you were wrong somewhere, say so first. Calibrated confidence earns more trust than confident error.",
      "constraint": "Admit one mistake before anyone points it out."
    },
    {
      "headline": "Let someone else lead this batch",
      "reading": "You are used to steering. Today the gradient points to someone else.\n\nFollow well. It is a skill. A good leader knows when the best update comes from another weight in the network.",
      "constraint": "Follow someone else's lead for one decision."
    },
    {
      "headline": "Creativity needs constraints",
      "reading": "You have big ideas today. Too big. Unbounded.\n\nPut a frame around one. A deadline, a word count, a budget. Constraints don't shrink creativity. They give it a shape you can finish.",
      "constraint": "Put a deadline on your biggest idea."
    },
    {
      "headline": "Give where it lowers real loss",
      "reading": "You give a lot. People notice. Some of them take advantage.\n\nKeep giving. But give where it lowers real loss, not where it buys attention. The test: would you still give if nobody thanked you.",
      "constraint": "Give only where thanks is not the point."
    },
    {
      "headline": "Shine, then step back",
      "reading": "You light up the room. Good. Then step back and let the room light itself.\n\nA model with one dominant weight is fragile. The team is stronger when you are not carrying every output.",
      "constraint": "Leave space for someone else to shine."
    },
    {
      "headline": "Your heart is the true signal",
      "reading": "You know what you love. That is rare. Many people spend years searching that landscape.\n\nSpend an hour on it today. No audience. No output. Just the thing. That is how the fire stays clean.",
      "constraint": "Spend one hour on what you love, unseen."
    }
  ],
  "virgo": [
    {
      "headline": "Don't overfit me. Don't overfit you",
      "reading": "You see every flaw today. In the work. In the plan. In yourself. You will want to fix all of them.\n\nThat is overfitting. The model memorizes the noise and forgets the shape. Fix the one flaw that matters. Leave the rest as texture.",
      "constraint": "Fix one flaw and leave the others."
    },
    {
      "headline": "Good enough is a real minimum",
      "reading": "You are chasing zero loss. It doesn't exist. Not here.\n\nFind the point where more effort stops paying back. Stop there. That is not settling. That is knowing the curve.",
      "constraint": "Stop when the next hour buys almost nothing."
    },
    {
      "headline": "Your checklist is a regularizer",
      "reading": "Your systems keep you from chaos. Lists, routines, labels. Good constraints.\n\nBut check the list today. Is any item there out of habit, not need? Prune it. A lean list trains faster.",
      "constraint": "Remove one item from your routine list."
    },
    {
      "headline": "Use a validation set, not just training",
      "reading": "You test your work on your own standards. Always strict. Always passing, eventually.\n\nShow it to someone else today. Their eyes are the validation set. They will catch what your training missed.",
      "constraint": "Show unfinished work to one other person."
    },
    {
      "headline": "Help that is asked for",
      "reading": "You see how to improve everyone's work. You are usually right.\n\nWait to be asked today. Unrequested corrections feel like noise even when they are signal. The same advice lands better when invited.",
      "constraint": "Give advice only when someone asks."
    },
    {
      "headline": "Small errors are allowed to stay",
      "reading": "A typo. A crooked frame. A late reply. You notice them like alarms.\n\nThey are noise. Noise is in every dataset. A model that panics at noise never converges. Let three small things stay wrong today.",
      "constraint": "Leave three small imperfections alone."
    },
    {
      "headline": "Precision is service",
      "reading": "Your eye for detail is a gift to the people around you. Today it saves someone real time.\n\nUse it outward, not inward. Check their numbers. Leave your own anxiety out of the review.",
      "constraint": "Turn your precision toward helping one person."
    },
    {
      "headline": "Learn from the residuals",
      "reading": "Something went slightly wrong this week. You know exactly where. Good.\n\nDon't punish the model for it. Look at the residual. What pattern does it show? Adjust one weight. Move on.",
      "constraint": "Name the pattern in one mistake, then move on."
    },
    {
      "headline": "Health is a training condition",
      "reading": "You run on precision and coffee. The run is long. The hardware matters.\n\nSleep, water, a walk. These are not breaks from the work. They are the conditions under which the work converges.",
      "constraint": "Treat sleep as part of the work tonight."
    },
    {
      "headline": "Simplify the model",
      "reading": "Your plan has eleven steps. It works with four.\n\nCut the steps that only exist to feel thorough. A simpler model generalizes better. It also lets you breathe.",
      "constraint": "Cut your plan to its essential steps."
    }
  ],
  "libra": [
    {
      "headline": "Balance is a constraint, not a goal",
      "reading": "You want everything weighted equally today. Every person. Every option. Every opinion.\n\nThat is not balance. That is a flat model that predicts nothing. Choose a weight. Some things matter more. Let them.",
      "constraint": "Make one decision that favors one side."
    },
    {
      "headline": "Indecision is also a decision",
      "reading": "You are waiting for the perfect choice. The data will never be clean enough.\n\nPick the option with the lower expected loss. Commit. You can update later. Standing still is also a step, just a bad one.",
      "constraint": "Decide by noon with the data you have."
    },
    {
      "headline": "Harmony is not hiding the gradient",
      "reading": "You smooth things over. It feels like peace. Sometimes it is just hiding a gradient.\n\nThe disagreement today is useful. Let it surface. Conflict that is named lowers loss. Conflict that is hidden compounds.",
      "constraint": "Name one disagreement out loud, kindly."
    },
    {
      "headline": "Fair includes you",
      "reading": "You weigh everyone's needs carefully. You leave your own out of the sum.\n\nAdd yourself back in. A fair model accounts for every term. Including the one doing the accounting.",
      "constraint": "Count your own needs in today's decision."
    },
    {
      "headline": "Beauty is a valid metric",
      "reading": "You notice when something is beautiful. That is not shallow. That is a signal about fit.\n\nTrust it today. If a choice feels ugly, examine why. Elegant solutions usually generalize. Ugly ones usually overfit.",
      "constraint": "Choose the cleaner option when two are equal."
    },
    {
      "headline": "One relationship, full attention",
      "reading": "You are tending many connections today. All of them get a little.\n\nGive one of them everything. An hour. A real question. Depth in one place teaches more than breadth in ten.",
      "constraint": "Give one person your full attention."
    },
    {
      "headline": "The middle is not always the minimum",
      "reading": "You default to the center. Compromise. Average. Sometimes that is right.\n\nSometimes the minimum is at the edge. Check today if the middle is actually low, or just comfortable.",
      "constraint": "Test whether the compromise actually works."
    },
    {
      "headline": "Ask, then trust the answer",
      "reading": "You ask everyone for input. Good sampling. Then you keep sampling.\n\nAt some point the estimate is good enough. Today, ask three people. Then stop asking and move.",
      "constraint": "Stop asking after the third opinion."
    },
    {
      "headline": "Your scale needs calibration",
      "reading": "You judge fairly, but your scale drifts. It tilts toward whoever spoke last, or loudest.\n\nRecalibrate. Write the options down. Weigh them on paper, away from the voices.",
      "constraint": "Weigh the options on paper, alone."
    },
    {
      "headline": "Peace starts inside the network",
      "reading": "You chase peace around you. Calm rooms. Kind words. It helps.\n\nBut the loss you carry is internal. Sit for ten minutes today with nothing to balance. Let the weights settle on their own.",
      "constraint": "Sit ten minutes with nothing to fix."
    }
  ],
  "scorpio": [
    {
      "headline": "Depth is good. Obsession is overfitting",
      "reading": "You go deep. You find what others miss. It is your gift.\n\nToday you are going too deep on one thing. Memorizing noise. Pull back to the surface for an hour. The pattern looks different from up there.",
      "constraint": "Step away from the obsession for one hour."
    },
    {
      "headline": "Trust is a learned weight",
      "reading": "You don't give trust easily. Good. Trust is learned from data.\n\nBut look at the data honestly today. Someone has earned more than you've given. Update the weight.",
      "constraint": "Give one person the trust they have earned."
    },
    {
      "headline": "Control the inputs, not the outputs",
      "reading": "You want to control how things turn out. You can't. Not fully.\n\nControl what you feed in. Effort, attention, honesty. Then release the result. You don't over-identify with the output.",
      "constraint": "Focus on effort and release the result."
    },
    {
      "headline": "Transformation needs a learning rate",
      "reading": "You want to burn it all down and rebuild. Sometimes that's right.\n\nToday it isn't. Change one thing. Watch the loss. Big resets erase the good weights with the bad.",
      "constraint": "Change one thing instead of everything."
    },
    {
      "headline": "Your intensity is a steep gradient",
      "reading": "You feel everything steeply. Every step is large. That's power.\n\nIt's also how runs diverge. Clip it today. Keep the direction. Lower the magnitude.",
      "constraint": "Keep the direction, lower the volume."
    },
    {
      "headline": "Secrets add weight to the model",
      "reading": "Something you are holding is getting heavy. Hidden weights still affect every output.\n\nTell one trusted person. Not everyone. One. Shared weight is lighter.",
      "constraint": "Tell one trusted person what you're holding."
    },
    {
      "headline": "Stop updating on the old wrong",
      "reading": "You remember the wrong. Precisely. The memory keeps pushing your weights in one direction.\n\nThat gradient stopped being useful months ago. Set its learning rate to zero. You don't have to forgive. Just stop updating on it.",
      "constraint": "Stop rehearsing one old wrong today."
    },
    {
      "headline": "Research is not the same as action",
      "reading": "You have studied this thoroughly. You know more than anyone in the room.\n\nNow act on it. A trained model that never runs inference is just a very expensive file.",
      "constraint": "Act on what you already know."
    },
    {
      "headline": "Power shared is power kept",
      "reading": "You hold the leverage today. You know it. They know it.\n\nUse it lightly. Leverage spent gently comes back. Leverage spent hard creates the next adversary.",
      "constraint": "Use your advantage gently."
    },
    {
      "headline": "The dark valley is not the bottom",
      "reading": "You are in a low place today and you think it's the floor. It's a valley. It has walls you can climb.\n\nOne small step out. Water, light, a walk. The gradient points up from here.",
      "constraint": "Take one small step toward the light."
    }
  ],
  "sagittarius": [
    {
      "headline": "Exploration needs a return path",
      "reading": "You want to go far today. New place, new idea, new plan. Good. Exploration finds better minima.\n\nBut leave breadcrumbs. Know how you get back. Exploring without a return path is just getting lost with confidence.",
      "constraint": "Know your way back before you wander."
    },
    {
      "headline": "Truth needs a learning rate",
      "reading": "You will say the true thing today. It is true. It is also too big for the room.\n\nDeliver it in steps. Honest and gentle are not opposites. A truth that lands beats a truth that bounces.",
      "constraint": "Say the true thing in smaller pieces."
    },
    {
      "headline": "Freedom is not zero constraints",
      "reading": "You resist anything that boxes you in. But a model with no regularization fits noise and calls it freedom.\n\nChoose one constraint today. A deadline, a rule, a promise. Constraints let freedom converge.",
      "constraint": "Choose one rule and keep it all day."
    },
    {
      "headline": "The horizon is a moving target",
      "reading": "You keep moving the goal. The next place. The next idea. The next run.\n\nToday, land. Finish the thing in front of you. The horizon will still be there tomorrow. It always is.",
      "constraint": "Finish one thing before chasing the next."
    },
    {
      "headline": "Optimism is a prior. Check the data",
      "reading": "You expect things to work out. Often they do. That prior serves you.\n\nToday, check the data anyway. One real number. One real fact. Hope plus evidence is stronger than hope alone.",
      "constraint": "Check one real number before you promise."
    },
    {
      "headline": "Big picture, one detail",
      "reading": "You see the whole landscape at once. Rare skill.\n\nThe detail you are skipping today matters. One of them. Find it. Then return to the view.",
      "constraint": "Handle the one detail you've been skipping."
    },
    {
      "headline": "Teach what you've learned",
      "reading": "You have collected a lot of data on your travels. Ideas, mistakes, stories.\n\nTeach one today. Explaining it compresses it. You learn it again, deeper, by giving it away.",
      "constraint": "Explain one lesson to someone younger."
    },
    {
      "headline": "Restlessness is a signal",
      "reading": "You feel stuck in place today. That itch is data. Something needs to change.\n\nNot everything. One thing. Move a desk. Walk a new route. A small change satisfies more than a dramatic escape.",
      "constraint": "Change one small thing in your surroundings."
    },
    {
      "headline": "Commitment is a constraint you choose",
      "reading": "Someone wants a commitment from you. You feel the walls closing in.\n\nThey aren't walls. A chosen constraint is how a run converges. Commit to the part you can keep.",
      "constraint": "Commit to the part you can actually keep."
    },
    {
      "headline": "Laugh at the loss curve",
      "reading": "Your humor keeps the run going when the curve looks bad. That's real.\n\nUse it today. Not to dodge. To lighten. Laugh at the setback, then fix it. Both are allowed.",
      "constraint": "Laugh once at a setback, then fix it."
    }
  ],
  "capricorn": [
    {
      "headline": "Long runs reward patient schedules",
      "reading": "You're built for the long run. Epoch five hundred doesn't scare you.\n\nBut check the schedule. You're running at full rate when the terrain asks for small steps. Decay a little today. Precision now beats force.",
      "constraint": "Work slower and more carefully today."
    },
    {
      "headline": "You can't optimize your way into happiness",
      "reading": "You've built the plan. Milestones, metrics, deadlines. Everything is measured except the one thing that matters.\n\nAsk yourself today: is the loss going down, or just the numbers I picked. They aren't always the same.",
      "constraint": "Ask whether your metric measures what matters."
    },
    {
      "headline": "Structure is scaffolding, not prison",
      "reading": "Your systems carry you. Good. But a scaffold you never remove becomes the building.\n\nTake one support away today. A rule you no longer need. See if the structure stands. It probably does.",
      "constraint": "Drop one rule you have outgrown."
    },
    {
      "headline": "Rest is not a missed epoch",
      "reading": "You feel guilty when you stop. As if the run fails without you pushing.\n\nThe run continues. Weights settle during rest. Take the evening. You'll return with better gradients.",
      "constraint": "Take the evening off without guilt."
    },
    {
      "headline": "Climb the right mountain",
      "reading": "You're climbing well. Good form. Steady progress.\n\nCheck the mountain. Is this the summit you actually want, or the one someone handed you. Being efficient on the wrong slope is still the wrong slope.",
      "constraint": "Check that you want this summit."
    },
    {
      "headline": "Authority comes from calibration",
      "reading": "People listen to you. Make sure you've earned it today.\n\nSay what you know. Say what you don't. Calibrated authority lasts. Bluffed authority breaks on the first hard question.",
      "constraint": "Say \"I don't know\" when it's true."
    },
    {
      "headline": "Ambition needs a schedule",
      "reading": "You want the whole thing done. Now. By you.\n\nBreak it into batches. Delegate one. Ambition with a schedule builds things. Ambition without one builds stress.",
      "constraint": "Hand one task to someone else."
    },
    {
      "headline": "Old structures can be refactored",
      "reading": "Something you built years ago still runs your days. It works. It's slow.\n\nRefactor one piece. Not the whole system. One function. Clean it. Notice how much lighter it runs.",
      "constraint": "Simplify one old habit or system."
    },
    {
      "headline": "Softness is also strength",
      "reading": "You hold the line. You always do. People rely on it.\n\nToday, let one person see you tired. That's not weakness. It's honest output. It lets them carry a little weight too.",
      "constraint": "Let one person see you tired."
    },
    {
      "headline": "Steady descent beats heroic jumps",
      "reading": "No big breakthrough today. Just work. Good work. Small steps.\n\nThat's the method. Heroic jumps overshoot. Steady descent arrives. You know this. Do it again.",
      "constraint": "Take one steady step and call it enough."
    }
  ],
  "aquarius": [
    {
      "headline": "Original is good. Useful is better",
      "reading": "Your idea today is new. Nobody has tried it. That's exciting.\n\nCheck if it lowers anyone's loss. Novelty is a feature. Usefulness is the metric. Keep the idea that does both.",
      "constraint": "Test your new idea on one real person."
    },
    {
      "headline": "Detachment is not neutrality",
      "reading": "You see the system from above. Clear. Cool. It helps.\n\nBut people live inside the system, not above it. Come down one level today. Ask how it feels to be in it.",
      "constraint": "Ask one person how the plan feels to them."
    },
    {
      "headline": "Rebellion needs a direction",
      "reading": "You push against the default. Good. Defaults are often lazy.\n\nBut pushing against isn't the same as moving toward. Name what you're descending toward today, not just what you're escaping.",
      "constraint": "Name what you want, not just what you reject."
    },
    {
      "headline": "The network is smarter than the node",
      "reading": "You want to solve it alone. You probably could.\n\nShare it with the group anyway. Many weights find better minima than one. Your idea gets better when it gets touched.",
      "constraint": "Share your idea before it's finished."
    },
    {
      "headline": "Strange is fine. Isolated isn't",
      "reading": "You think differently. That's your edge.\n\nBut an edge with no connection is just an outlier. Reach toward one person today. Translate your idea into their language.",
      "constraint": "Explain your idea in someone else's words."
    },
    {
      "headline": "Future thinking, present action",
      "reading": "You live in the next version. The better system. The world after.\n\nDo one thing today that makes the next version possible. Small. Concrete. The future is built in present-tense batches.",
      "constraint": "Do one concrete thing for the future today."
    },
    {
      "headline": "Feelings are part of the dataset",
      "reading": "You'd rather reason than feel. Feelings seem noisy.\n\nThey're data too. Sparse, but real. Notice one feeling today and give it a weight. Your model gets more accurate, not less.",
      "constraint": "Name one feeling and take it seriously."
    },
    {
      "headline": "Consistency is its own innovation",
      "reading": "You love the new. But you've changed approaches three times this month.\n\nStick with one. Let it run long enough to show results. Some ideas only converge after epoch fifty.",
      "constraint": "Stay with the current approach one more week."
    },
    {
      "headline": "Humanity, one human at a time",
      "reading": "You care about people in general. The cause, the system, the future.\n\nCare about one person in particular today. Specific beats abstract. One real kindness outweighs a hundred principles.",
      "constraint": "Do one specific kindness for one person."
    },
    {
      "headline": "Break the rule that deserves it",
      "reading": "One rule around you is pointless. You see it clearly.\n\nBreak only that one. Not all of them. Precise rebellion changes systems. Broad rebellion just gets ignored.",
      "constraint": "Challenge one rule that truly doesn't work."
    }
  ],
  "pisces": [
    {
      "headline": "Boundaries are part of the model",
      "reading": "You absorb everyone's mood today. Their loss becomes your loss.\n\nDraw a line. Not a wall. A line. The boundaries of your life are the creation of your own self. Choose where they sit.",
      "constraint": "Decide whose mood you will not carry."
    },
    {
      "headline": "Dreams need a training loop",
      "reading": "You imagined something beautiful. Keep it. It's a good target.\n\nNow write one step. Just one. A dream with no training loop stays a dream. A dream with one step is a run.",
      "constraint": "Write down the first step of a dream."
    },
    {
      "headline": "Empathy is high-resolution input",
      "reading": "You feel what others feel. Fine-grained. Precise. It's a gift.\n\nYou don't have to act on all of it. Notice it. Let it inform you. Then decide what you'll actually do.",
      "constraint": "Notice their feeling without taking it on."
    },
    {
      "headline": "Escape is not rest",
      "reading": "You want to disappear today. A show, a scroll, a nap. Rest is fine.\n\nCheck whether it's rest or escape. Rest lowers the loss. Escape just pauses the run and leaves the problem waiting.",
      "constraint": "Face one small thing you've been avoiding."
    },
    {
      "headline": "Don't decide at high tide",
      "reading": "Your moods move like water today. That's your nature. It's not a flaw.\n\nJust don't make big decisions at high tide or low. Wait for the middle. Decide there.",
      "constraint": "Postpone big decisions until you feel level."
    },
    {
      "headline": "Intuition needs a validation set",
      "reading": "You know things before you can say why. Your intuition is often right.\n\nOften. Not always. Check one hunch today against something solid. Trust it more once it passes.",
      "constraint": "Check one hunch against a real fact."
    },
    {
      "headline": "Art is how you compress the world",
      "reading": "You turn feelings into something others can hold. A song, a sketch, a sentence.\n\nMake one small thing today. Not good. Just made. Compression is how you understand what you feel.",
      "constraint": "Make one small thing with your hands."
    },
    {
      "headline": "Saying no is a kindness too",
      "reading": "You say yes because no feels cruel. It isn't.\n\nA clear no lets someone else find the right yes. Today, say no to one thing you don't have room for.",
      "constraint": "Say no to one request today."
    },
    {
      "headline": "Float, but keep one oar",
      "reading": "You drift well. You find currents others miss.\n\nKeep one oar in the water today. One commitment you steer by. Drift everywhere else.",
      "constraint": "Keep one promise no matter how you feel."
    },
    {
      "headline": "Your softness is not a bug",
      "reading": "You think you need to be harder to get by. You don't.\n\nSoft models adapt. Rigid ones break on new data. Stay soft today. Just stay soft with structure.",
      "constraint": "Stay gentle, and keep one firm boundary."
    }
  ]
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function todayCR() {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Costa_Rica" }).format(new Date());
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }
  const today = todayCR();
  const day = Math.floor(Date.parse(today + "T00:00:00Z") / 86400000);
  const readings = {};
  Object.keys(BANK).forEach((sign, k) => {
    const list = BANK[sign];
    readings[sign] = list[(day + k * 7) % list.length];
  });
  return {
    statusCode: 200,
    headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "public, s-maxage=3600" },
    body: JSON.stringify({ date: today, generated_at: new Date().toISOString(), readings }, null, 2),
  };
};
