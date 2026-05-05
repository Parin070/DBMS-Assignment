require('dotenv').config();
async function checkModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'your_gemini_key_here') {
        console.log("Please set a valid GEMINI_API_KEY in .env");
        return;
    }
    
    console.log("--- Models in v1 ---");
    try {
        const res1 = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${key}`);
        const data1 = await res1.json();
        if (data1.models) {
            console.log(data1.models.map(m => m.name));
        } else {
            console.log(data1);
        }
    } catch (e) {
        console.error(e);
    }

    console.log("\n--- Models in v1beta ---");
    try {
        const res2 = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data2 = await res2.json();
        if (data2.models) {
            console.log(data2.models.map(m => m.name));
        } else {
            console.log(data2);
        }
    } catch (e) {
        console.error(e);
    }
}
checkModels();
