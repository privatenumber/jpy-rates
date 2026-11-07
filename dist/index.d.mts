type SourceId = 'murc' | 'customs' | 'boj' | 'boj-stat';
type RateSource = {
    id: SourceId;
    name: string;
    publisher: string;
    provides: string;
    coverage: string;
    url: string;
    terms: {
        summary: string;
        url: string;
    };
    /** Credit to show when publishing data from this source. */
    attribution: string;
};
declare const rateSources: RateSource[];

type GuideRule = {
    /** Citation name, such as 所得税基本通達57の3-2 */
    name: string;
    url: string;
    /** Exact excerpts of the rule text. Official notices are not copyrighted (著作権法13条). */
    excerpts: string[];
};
type GuideTopic = {
    id: string;
    title: string;
    titleJa: string;
    source: SourceId;
    /** Which rate to use, such as TTB */
    rate: string;
    /** Which date's rate to use */
    date: string;
    /** Whose rate the rule asks for */
    institution: string;
    rules: GuideRule[];
    notes: string[];
    /** CLI command that fetches the rate, with <placeholders> */
    command: string;
};
declare const guideTopics: GuideTopic[];
declare const getGuideTopic: (id: string) => GuideTopic | undefined;

export { getGuideTopic, guideTopics, rateSources };
export type { GuideRule, GuideTopic, RateSource, SourceId };
