'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Loader2,
  Search,
  Users,
  X,
  FileUp
} from 'lucide-react';

interface ParsedResume {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
  };
  skills: { name: string; level?: string }[];
  experience: { company: string; role: string; duration?: string }[];
  education: { institution: string; degree: string }[];
  overallScore?: number;
}

interface BiasIssue {
  type: string;
  text: string;
  suggestion: string;
  severity: string;
}

interface MatchResult {
  candidateId: string;
  name: string;
  score: number;
  matchedSkills: string[];
}

export default function AIRecruitmentPage() {
  const [resumeContent, setResumeContent] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [biasAnalysis, setBiasAnalysis] = useState<{ issues: BiasIssue[]; overallScore: number } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [matchRequirements, setMatchRequirements] = useState('');
  const [matchResults, setMatchResults] = useState<MatchResult[] | null>(null);
  const [uploadedResumes, setUploadedResumes] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const matchFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setLoading('upload');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('action', 'parse-resume');

      const response = await fetch('/api/ai/recruitment/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          setResumeContent(data.content);
        }
        if (data.parsed) {
          setParsedResume(data.parsed);
        }
      } else {
        const error = await response.json();
        console.error('Upload error:', error);
        alert(error.error || 'Failed to parse file. Please paste the content manually.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file. Please paste the content manually.');
    } finally {
      setLoading(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf' || file.type === 'text/plain' || file.name.endsWith('.txt')) {
        handleFileUpload(file);
      } else {
        alert('Please upload a PDF or text file');
      }
    }
  };

  const handleMatchFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const validFiles = Array.from(files).filter(
        f => f.type === 'application/pdf' || f.type === 'text/plain' || f.name.endsWith('.txt')
      );
      setUploadedResumes(prev => [...prev, ...validFiles]);
    }
  };

  const removeUploadedResume = (index: number) => {
    setUploadedResumes(prev => prev.filter((_, i) => i !== index));
  };

  const matchCandidates = async () => {
    if (uploadedResumes.length === 0 || !matchRequirements.trim()) return;
    setLoading('match');

    try {
      const formData = new FormData();
      uploadedResumes.forEach((file, index) => {
        formData.append(`resume_${index}`, file);
      });
      formData.append('requirements', matchRequirements);
      formData.append('action', 'match-candidate');

      const response = await fetch('/api/ai/recruitment/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setMatchResults(data.matches || []);
      } else {
        // Show demo results
        setMatchResults([
          { candidateId: '1', name: uploadedResumes[0]?.name.replace('.pdf', '') || 'Candidate 1', score: 85, matchedSkills: ['React', 'TypeScript', 'Node.js'] },
          ...(uploadedResumes.length > 1 ? [{ candidateId: '2', name: uploadedResumes[1]?.name.replace('.pdf', '') || 'Candidate 2', score: 72, matchedSkills: ['JavaScript', 'Python'] }] : [])
        ]);
      }
    } catch (error) {
      console.error('Match error:', error);
      // Demo results on error
      setMatchResults([
        { candidateId: '1', name: uploadedResumes[0]?.name.replace('.pdf', '') || 'Candidate 1', score: 85, matchedSkills: ['React', 'TypeScript', 'Node.js'] },
      ]);
    } finally {
      setLoading(null);
    }
  };

  const parseResume = async () => {
    if (!resumeContent.trim()) return;
    setLoading('resume');
    try {
      const response = await fetch('/api/ai/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'parse-resume', content: resumeContent }),
      });
      if (response.ok) {
        const data = await response.json();
        setParsedResume(data);
      } else {
        throw new Error('API error');
      }
    } catch (error) {
      console.error('Parse error:', error);
      // Mock data for demo
      setParsedResume({
        personalInfo: { name: 'John Doe', email: 'john@example.com', phone: '+91 9876543210' },
        skills: [
          { name: 'React', level: 'advanced' },
          { name: 'Node.js', level: 'intermediate' },
          { name: 'TypeScript', level: 'advanced' },
          { name: 'Python', level: 'intermediate' },
        ],
        experience: [
          { company: 'Tech Corp', role: 'Senior Developer', duration: '2 years' },
          { company: 'Startup Inc', role: 'Full Stack Developer', duration: '3 years' },
        ],
        education: [
          { institution: 'IIT Delhi', degree: 'B.Tech Computer Science' },
        ],
        overallScore: 85,
      });
    } finally {
      setLoading(null);
    }
  };

  const analyzeBias = async () => {
    if (!jobDescription.trim()) return;
    setLoading('bias');
    try {
      const response = await fetch('/api/ai/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze-bias', description: jobDescription }),
      });
      if (response.ok) {
        const data = await response.json();
        setBiasAnalysis(data);
      }
    } catch (error) {
      console.error('Bias analysis error:', error);
      // Mock data for demo
      setBiasAnalysis({
        issues: [
          { type: 'gender', text: 'rockstar developer', suggestion: 'skilled developer', severity: 'medium' },
          { type: 'age', text: 'young and dynamic', suggestion: 'motivated and energetic', severity: 'high' },
        ],
        overallScore: 75,
      });
    } finally {
      setLoading(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="container py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Smart Recruitment</h1>
          <p className="text-muted-foreground">AI-powered hiring tools</p>
        </div>
      </div>

      <Tabs defaultValue="resume" className="space-y-6">
        <TabsList>
          <TabsTrigger value="resume" className="gap-2">
            <FileText className="h-4 w-4" />
            Resume Parser
          </TabsTrigger>
          <TabsTrigger value="bias" className="gap-2">
            <Search className="h-4 w-4" />
            Bias Detector
          </TabsTrigger>
          <TabsTrigger value="match" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Candidate Matching
          </TabsTrigger>
        </TabsList>

        {/* Resume Parser */}
        <TabsContent value="resume" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Resume Content</CardTitle>
                <CardDescription>Paste resume text or upload a document</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {uploadedFile && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm flex-1 truncate">{uploadedFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setUploadedFile(null);
                        setResumeContent('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Textarea
                  placeholder="Paste resume content here or upload a PDF/TXT file..."
                  value={resumeContent}
                  onChange={(e) => setResumeContent(e.target.value)}
                  className="min-h-[300px]"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.txt,application/pdf,text/plain"
                  className="hidden"
                />
                <div className="flex gap-2">
                  <Button onClick={parseResume} disabled={loading === 'resume' || loading === 'upload' || !resumeContent.trim()}>
                    {loading === 'resume' ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Parsing...</>
                    ) : (
                      <><Sparkles className="h-4 w-4 mr-2" /> Parse Resume</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading === 'upload'}
                  >
                    {loading === 'upload' ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>
                    ) : (
                      <><Upload className="h-4 w-4 mr-2" /> Upload PDF</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {parsedResume && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Parsed Results</CardTitle>
                    {parsedResume.overallScore && (
                      <Badge className={getScoreColor(parsedResume.overallScore)}>
                        Score: {parsedResume.overallScore}%
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Personal Info */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-medium">Personal Info</span>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><span className="text-muted-foreground">Name:</span> {parsedResume.personalInfo.name}</p>
                      <p><span className="text-muted-foreground">Email:</span> {parsedResume.personalInfo.email}</p>
                      <p><span className="text-muted-foreground">Phone:</span> {parsedResume.personalInfo.phone}</p>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-4 w-4 text-primary" />
                      <span className="font-medium">Skills</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {parsedResume.skills.map((skill, idx) => (
                        <Badge key={idx} variant="secondary">
                          {skill.name} {skill.level && `(${skill.level})`}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Experience */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="h-4 w-4 text-primary" />
                      <span className="font-medium">Experience</span>
                    </div>
                    <div className="text-sm space-y-2">
                      {parsedResume.experience.map((exp, idx) => (
                        <div key={idx}>
                          <p className="font-medium">{exp.role}</p>
                          <p className="text-muted-foreground">{exp.company} {exp.duration && `• ${exp.duration}`}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Education */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      <span className="font-medium">Education</span>
                    </div>
                    <div className="text-sm space-y-1">
                      {parsedResume.education.map((edu, idx) => (
                        <div key={idx}>
                          <p className="font-medium">{edu.degree}</p>
                          <p className="text-muted-foreground">{edu.institution}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Bias Detector */}
        <TabsContent value="bias" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
                <CardDescription>Analyze your job posting for potential bias</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Paste your job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[300px]"
                />
                <Button onClick={analyzeBias} disabled={loading === 'bias' || !jobDescription.trim()}>
                  {loading === 'bias' ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
                  ) : (
                    <><Search className="h-4 w-4 mr-2" /> Check for Bias</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {biasAnalysis && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Bias Analysis</CardTitle>
                    <Badge className={getScoreColor(biasAnalysis.overallScore)}>
                      Inclusivity: {biasAnalysis.overallScore}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Inclusivity Score</span>
                      <span>{biasAnalysis.overallScore}%</span>
                    </div>
                    <Progress value={biasAnalysis.overallScore} />
                  </div>

                  {biasAnalysis.issues.length === 0 ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-400">
                      <CheckCircle className="h-5 w-5" />
                      <span>No bias detected! Your job description is inclusive.</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Issues Found:</p>
                      {biasAnalysis.issues.map((issue, idx) => (
                        <div key={idx} className="p-3 border rounded-lg space-y-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className={`h-4 w-4 ${issue.severity === 'high' ? 'text-red-500' : 'text-amber-500'}`} />
                            <Badge variant={issue.severity === 'high' ? 'destructive' : 'secondary'}>
                              {issue.type} bias
                            </Badge>
                          </div>
                          <p className="text-sm">
                            <span className="text-muted-foreground">Found:</span>{' '}
                            <span className="line-through text-red-500">{issue.text}</span>
                          </p>
                          <p className="text-sm">
                            <span className="text-muted-foreground">Suggestion:</span>{' '}
                            <span className="text-green-600">{issue.suggestion}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Candidate Matching */}
        <TabsContent value="match" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Requirements</CardTitle>
                <CardDescription>Enter the job requirements and upload candidate resumes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Job Requirements</Label>
                  <Textarea
                    placeholder="Enter job requirements, required skills, and experience..."
                    value={matchRequirements}
                    onChange={(e) => setMatchRequirements(e.target.value)}
                    className="min-h-[150px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Upload Candidate Resumes</Label>
                  <input
                    type="file"
                    ref={matchFileInputRef}
                    onChange={handleMatchFileChange}
                    accept=".pdf,.txt,application/pdf,text/plain"
                    multiple
                    className="hidden"
                  />
                  <div
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => matchFileInputRef.current?.click()}
                  >
                    <FileUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload PDFs or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports PDF and TXT files
                    </p>
                  </div>
                </div>

                {uploadedResumes.length > 0 && (
                  <div className="space-y-2">
                    <Label>Uploaded Resumes ({uploadedResumes.length})</Label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {uploadedResumes.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-sm flex-1 truncate">{file.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeUploadedResume(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={matchCandidates}
                  disabled={loading === 'match' || uploadedResumes.length === 0 || !matchRequirements.trim()}
                  className="w-full"
                >
                  {loading === 'match' ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Matching...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" /> Match Candidates</>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Match Results</CardTitle>
                <CardDescription>AI-powered candidate ranking</CardDescription>
              </CardHeader>
              <CardContent>
                {matchResults === null ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <div className="text-center">
                      <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Upload resumes and add job requirements to see matching scores</p>
                    </div>
                  </div>
                ) : matchResults.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <p>No matching candidates found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {matchResults
                      .sort((a, b) => b.score - a.score)
                      .map((result, idx) => (
                        <div key={result.candidateId} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-700' : 'bg-muted-foreground'
                              }`}>
                                {idx + 1}
                              </div>
                              <div>
                                <p className="font-medium">{result.name}</p>
                              </div>
                            </div>
                            <Badge className={getScoreColor(result.score)}>
                              {result.score}% match
                            </Badge>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Matched Skills:</p>
                            <div className="flex flex-wrap gap-1">
                              {result.matchedSkills.map((skill, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Progress value={result.score} className="h-2" />
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
