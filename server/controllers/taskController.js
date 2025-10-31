const Task = require('../models/Task');

exports.getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.user.id });

        const scoredTasks = tasks.map(task => {
            let score = 0;

            // 1. Priority Score (Sabse important)
            if (task.priority === 'High') score += 1000;
            if (task.priority === 'Medium') score += 500;

            // 2. Deadline Score (Jo deadline paas hai, woh zyada important)
            if (task.deadline) {
                const today = new Date();
                const deadline = new Date(task.deadline);
                const daysUntilDeadline = (deadline.getTime() - today.getTime()) / (1000 * 3600 * 24);

                if (daysUntilDeadline < 0) {
                    score += 2000; // Overdue tasks ko sabse upar rakho
                } else if (daysUntilDeadline < 2) {
                    score += 300; // 2 din se kam
                } else if (daysUntilDeadline < 7) {
                    score += 100; // 1 hafte se kam
                }
            }

            // 3. Status Score (Completed tasks ko neeche rakho)
            if (task.completed) {
                score -= 5000;
            }

            return { ...task.toObject(), score };
        });

        // Score ke hisab se sort 
        scoredTasks.sort((a, b) => b.score - a.score);

        res.json(scoredTasks);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.createTask = async (req, res) => {
    const { title, description, deadline, priority, category } = req.body; 
    try {
        const newTask = new Task({
            userId: req.user.id,
            title,
            description,
            deadline,
            priority,
            category // category add kiya
        });
        const task = await newTask.save();
        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateTask = async (req, res) => {
    const { title, description, deadline, priority, completed, category } = req.body; // category add kiya
    try {
        let task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ msg: 'Task not found' });
        if (task.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }
        
        const updatedFields = { title, description, deadline, priority, completed, category }; // category add kiya

        task = await Task.findByIdAndUpdate(req.params.id, { $set: updatedFields }, { new: true });
        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};


exports.deleteTask = async (req, res) => {
    try {
        let task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ msg: 'Task not found' });
        if (task.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }
        
        // Yahan badlaav kiya gaya hai
        await Task.findByIdAndDelete(req.params.id); 

        res.json({ msg: 'Task removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};