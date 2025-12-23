const Task = require('../models/Task');

exports.getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.user.id });

        const scoredTasks = tasks.map(task => {
            let score = 0;

            if (task.priority === 'High') score += 1000;
            if (task.priority === 'Medium') score += 500;

            if (task.deadline) {
                const today = new Date();
                const deadline = new Date(task.deadline);
                const daysUntilDeadline = (deadline.getTime() - today.getTime()) / (1000 * 3600 * 24);

                if (daysUntilDeadline < 0) {
                    score += 2000; 
                } else if (daysUntilDeadline < 2) {
                    score += 300; 
                } else if (daysUntilDeadline < 7) {
                    score += 100; 
                }
            }

            
            if (task.completed) {
                score -= 5000;
            }

            return { ...task.toObject(), score };
        });

        
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
            category 
        });
        const task = await newTask.save();
        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateTask = async (req, res) => {
    const { title, description, deadline, priority, completed, category } = req.body; 
    try {
        let task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ msg: 'Task not found' });
        if (task.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }
        
        const updatedFields = { title, description, deadline, priority, completed, category }; 

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
        
        
        await Task.findByIdAndDelete(req.params.id); 

        res.json({ msg: 'Task removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};