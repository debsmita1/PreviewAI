export type DataMineContextType = {
  remoteUrl: string;
  githubToken: string;
  maxExamples?: number;
};

export type CustomPromptType = {
  prompt?: {
    reviewerRole?: string;
    reviewCriteria?: string;
    testCriteria?: string;
    outputFormat?: string;
    otherNotes?: string;
  };
  dataMineContext?: DataMineContextType;
};
