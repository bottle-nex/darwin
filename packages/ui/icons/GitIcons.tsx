import { createIcon } from "./createIcon";
import { FaCodeBranch, FaGithub, FaLock } from "react-icons/fa6";
import {
    GoFileCode,
    GoFileDiff,
    GoGitCommit,
    GoGitMerge,
    GoGitPullRequest,
    GoGitPullRequestClosed,
} from "react-icons/go";
import { LuFileDiff } from "react-icons/lu";
import { MdChevronLeft } from "react-icons/md";

export const BranchMergeDirectionIcon = createIcon(MdChevronLeft);

export const ChangedFilesIcon = createIcon(LuFileDiff);

export const CommitsIcon = createIcon(GoGitCommit);

export const DiffFileRowIcon = createIcon(GoFileCode);

export const GitBranchIcon = createIcon(FaCodeBranch);

export const GithubLogoIcon = createIcon(FaGithub);

export const MergeIcon = createIcon(GoGitMerge);

export const PrivateRepoIcon = createIcon(FaLock);

export const PullRequestClosedIcon = createIcon(GoGitPullRequestClosed);

export const PullRequestOpenIcon = createIcon(GoGitPullRequest);

export const ReviewCommentFileIcon = createIcon(GoFileDiff);
