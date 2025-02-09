export class Ai {
    constructor(resume="", jobDescription="") {
        this.resume = resume
        this.jobDescription = jobDescription
        this.system = "";
        this.prevUserAnswer = [];
        this.prevAiQuestion = [];
    }
}