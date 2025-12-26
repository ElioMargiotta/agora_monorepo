'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Trash2, Save, Send, ArrowLeft, Calendar, Eye, Edit, ImagePlus, Link2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { pinJSONToIPFS } from '@/lib/ipfs';
import { uploadAndCreateProposal } from '@/services/contractService';

export default function CreateProposalPage({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address } = useAccount();
  const { toast } = useToast();
  const { space_name } = use(params);

  // Draft state
  const [draftId, setDraftId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [choices, setChoices] = useState(['Yes', 'No']);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [proposalType, setProposalType] = useState(0); // 0: NonWeighted, 1: WeightedSingle, 2: WeightedFractional
  const [eligibilityType, setEligibilityType] = useState(0); // 0: Public, 1: Token Holder
  const [eligibilityToken, setEligibilityToken] = useState(process.env.NEXT_PUBLIC_MOCK_GOVERNANCE_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000');
  const [eligibilityThreshold, setEligibilityThreshold] = useState('1');
  const [passingThreshold, setPassingThreshold] = useState('50');
  const [includeAbstain, setIncludeAbstain] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [descriptionMode, setDescriptionMode] = useState('edit'); // 'edit' or 'preview'
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Get spaceId from URL params
  const spaceId = searchParams.get('spaceId');

  // Load existing draft
  const loadDraft = async (id) => {
    try {
      const response = await fetch(`/api/proposal-draft?draftId=${id}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const draft = result.data;
        setTitle(draft.title || '');
        setDescription(draft.description || '');
        setChoices(draft.choices || ['Yes', 'No']);
        setStartDate(draft.startDate || '');
        setEndDate(draft.endDate || '');
        setProposalType(draft.proposalType || 0);
        setEligibilityType(draft.eligibilityType || 0);
        setEligibilityToken(draft.eligibilityToken || process.env.NEXT_PUBLIC_MOCK_GOVERNANCE_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000');
        setEligibilityThreshold(draft.eligibilityThreshold || '1');
        setPassingThreshold(draft.passingThreshold || '50');
        setIncludeAbstain(draft.includeAbstain !== undefined ? draft.includeAbstain : true);
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      toast({
        title: 'Error',
        description: 'Failed to load draft',
        variant: 'destructive'
      });
    }
  };

  // Initialize draftId
  useEffect(() => {
    const existingDraftId = searchParams.get('draftId');
    if (existingDraftId) {
      setDraftId(existingDraftId);
      loadDraft(existingDraftId);
    } else {
      // Generate new draftId
      const newDraftId = `draft_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      setDraftId(newDraftId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Save draft to MongoDB
  const saveDraft = async (isAutoSave = false) => {
    if (!address || !spaceId || !draftId) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet',
        variant: 'destructive'
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Title is required',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/proposal-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId,
          spaceId,
          title,
          description,
          choices,
          startDate,
          endDate,
          proposalType,
          eligibilityType,
          eligibilityToken,
          eligibilityThreshold,
          passingThreshold,
          includeAbstain,
          createdBy: address
        })
      });

      const result = await response.json();

      if (result.success) {
        setLastSaved(new Date());
        if (!isAutoSave) {
          toast({
            title: 'Success',
            description: 'Draft saved successfully'
          });
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      if (!isAutoSave) {
        toast({
          title: 'Error',
          description: 'Failed to save draft',
          variant: 'destructive'
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save every 5 minutes
  useEffect(() => {
    if (!draftId || !address || !spaceId) return;

    const autoSaveInterval = setInterval(() => {
      if (title.trim()) {
        saveDraft(true);
      }
    }, 300000);

    return () => clearInterval(autoSaveInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId, address, spaceId, title, description, choices, startDate, endDate, proposalType, eligibilityType, eligibilityToken, eligibilityThreshold, passingThreshold, includeAbstain]);

  // Publish proposal to blockchain
  const publishProposal = async () => {
    if (!address || !spaceId) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet',
        variant: 'destructive'
      });
      return;
    }

    if (!title.trim() || !description.trim()) {
      toast({
        title: 'Error',
        description: 'Title and description are required',
        variant: 'destructive'
      });
      return;
    }

    if (choices.length < 2) {
      toast({
        title: 'Error',
        description: 'At least 2 choices are required',
        variant: 'destructive'
      });
      return;
    }

    setIsPublishing(true);
    try {
      // First, save the draft one more time
      await saveDraft(true);

      // Upload description to IPFS
      const proposalMetadata = {
        title,
        description,
        choices,
        startDate,
        endDate,
        createdAt: new Date().toISOString()
      };

      toast({
        title: 'Uploading to IPFS',
        description: 'Please wait...'
      });

      const ipfsHash = await pinJSONToIPFS(proposalMetadata);

      if (!ipfsHash) {
        throw new Error('Failed to upload to IPFS');
      }

      // Create proposal on blockchain
      toast({
        title: 'Creating proposal',
        description: 'Please confirm the transaction...'
      });

      // Validate dates
      const startTimestamp = startDate ? new Date(startDate).getTime() : Date.now();
      const endTimestamp = endDate ? new Date(endDate).getTime() : Date.now() + 604800000; // Default 1 week

      if (endTimestamp <= startTimestamp) {
        throw new Error('End date must be after start date');
      }

      if (endTimestamp <= Date.now()) {
        throw new Error('End date must be in the future');
      }

      // Get final choices array (contract handles abstain if includeAbstain is true)
      // Do NOT include "Abstain" in the choices array - the contract adds it automatically
      const finalChoices = [...choices];

      const result = await uploadAndCreateProposal(
        spaceId,
        title,
        ipfsHash,
        finalChoices,
        {
          startDate,
          endDate,
          proposalType,
          eligibilityType,
          eligibilityToken,
          eligibilityThreshold,
          passingThreshold,
          includeAbstain
        }
      );

      if (result.success) {
        // Mark draft as published
        await fetch('/api/proposal-draft', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            draftId,
            proposalId: result.proposalId || 'unknown'
          })
        });

        toast({
          title: 'Success',
          description: 'Proposal created successfully!'
        });

        // Navigate back to space page
        router.push(`/app/${space_name}`);
      } else {
        throw new Error(result.error || 'Failed to create proposal');
      }
    } catch (error) {
      console.error('Error publishing proposal:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish proposal',
        variant: 'destructive'
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Add choice
  const addChoice = () => {
    const maxChoices = includeAbstain ? 9 : 10; // Leave room for abstain if included
    if (choices.length < maxChoices) {
      setChoices([...choices, '']);
    }
  };

  // Update choice
  const updateChoice = (index, value) => {
    const newChoices = [...choices];
    newChoices[index] = value;
    setChoices(newChoices);
  };

  // Remove choice
  const removeChoice = (index) => {
    if (choices.length > 2) {
      const newChoices = choices.filter((_, i) => i !== index);
      setChoices(newChoices);
    }
  };

  // Insert image markdown at cursor position
  const insertImageMarkdown = (url, altText = 'Image') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const markdown = `![${altText}](${url})`;
    const newText = description.substring(0, start) + markdown + description.substring(end);
    
    setDescription(newText);
    
    // Set cursor position after inserted markdown
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + markdown.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  // Handle image file upload
  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploadingImage(true);

    try {
      // Upload image to IPFS via Pinata
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image to IPFS');
      }

      const result = await response.json();
      
      if (result.success && result.ipfsHash) {
        const imageUrl = `https://sapphire-impressive-salamander-839.mypinata.cloud/ipfs/${result.ipfsHash}`;
        insertImageMarkdown(imageUrl, file.name);
        
        toast({
          title: 'Image uploaded',
          description: 'Image added to description',
        });
      } else {
        throw new Error(result.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle image URL insertion
  const handleInsertImageUrl = () => {
    if (!imageUrl.trim()) return;
    
    insertImageMarkdown(imageUrl.trim());
    setImageUrl('');
    setShowImageUrlInput(false);
    
    toast({
      title: 'Image added',
      description: 'Image URL inserted in description',
    });
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push(`/app/${space_name}`)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {space_name}
        </Button>
        {lastSaved && (
          <span className="text-sm text-muted-foreground">
            Last saved: {lastSaved.toLocaleTimeString()}
          </span>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Proposal</CardTitle>
          <CardDescription>
            Draft your proposal. It will be auto-saved every 5 minutes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter proposal title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
            <p className="text-sm text-muted-foreground">
              {title.length}/200 characters
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Description * (Markdown supported)</Label>
              <div className="flex gap-1 border border-gray-200 rounded-md p-1">
                <Button
                  type="button"
                  variant={descriptionMode === 'edit' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDescriptionMode('edit')}
                  className="gap-1 h-7 text-xs"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant={descriptionMode === 'preview' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDescriptionMode('preview')}
                  className="gap-1 h-7 text-xs"
                >
                  <Eye className="h-3 w-3" />
                  Preview
                </Button>
              </div>
            </div>
            {descriptionMode === 'edit' && (
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="gap-1 h-8 text-xs"
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  {uploadingImage ? 'Uploading...' : 'Add Image from Computer'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImageUrlInput(!showImageUrlInput)}
                  className="gap-1 h-8 text-xs"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Add Image from URL
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            )}
            {showImageUrlInput && descriptionMode === 'edit' && (
              <div className="flex gap-2 p-3 bg-gray-50 rounded-md border">
                <Input
                  placeholder="Enter image URL (https://...)" 
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleInsertImageUrl();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleInsertImageUrl}
                  disabled={!imageUrl.trim()}
                >
                  Insert
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowImageUrlInput(false);
                    setImageUrl('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
            {descriptionMode === 'edit' ? (
              <Textarea
                ref={textareaRef}
                id="description"
                placeholder={`Describe your proposal in detail...\n\nMarkdown examples:\n# Main Title\n## Subtitle\n### Section\n\n**bold** *italic* ~~strikethrough~~\n\n- Bullet list\n1. Numbered list\n\n[Link text](https://example.com)\n\n![Image](https://example.com/image.jpg)\n\n> Quote\n\n\`code\`\n\n<center>Centered text</center>`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
                maxLength={10000}
              />
            ) : (
              <div className="min-h-[300px] p-4 border rounded-md bg-white overflow-auto">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    rehypePlugins={[rehypeRaw]}
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-3xl font-bold mb-4 mt-6" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-2xl font-bold mb-3 mt-5" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-xl font-semibold mb-2 mt-4" {...props} />,
                    h4: ({node, ...props}) => <h4 className="text-lg font-semibold mb-2 mt-3" {...props} />,
                    p: ({node, ...props}) => <p className="mb-3 leading-relaxed" {...props} />,
                    a: ({node, ...props}) => <a className="text-[#4D89B0] underline hover:text-[#4D89B0]/80" target="_blank" rel="noopener noreferrer" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 space-y-1" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 space-y-1" {...props} />,
                    li: ({node, ...props}) => <li className="ml-4" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-[#4D89B0] pl-4 italic my-4" {...props} />,
                      code: ({node, inline, ...props}) => 
                        inline 
                          ? <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props} />
                          : <code className="block bg-gray-100 p-3 rounded text-sm font-mono overflow-x-auto my-3" {...props} />,
                      img: ({node, src, alt, ...props}) => {
                        // Don't render if no src
                        if (!src) return null;
                        
                        // Convert IPFS URLs to gateway URLs
                        let imageUrl = src;
                        if (src.startsWith('ipfs://')) {
                          imageUrl = `https://sapphire-impressive-salamander-839.mypinata.cloud/ipfs/${src.replace('ipfs://', '')}`;
                        } else if (src.startsWith('data:')) {
                          // Use regular img tag for data URLs (legacy support)
                          return (
                            <span className="inline-block my-2 max-w-md">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img 
                                src={src} 
                                alt={alt || 'Uploaded image'} 
                                className="max-w-full h-auto rounded shadow-sm border border-gray-200" 
                                onError={(e) => {
                                  console.error('Image load error:', src?.substring(0, 50));
                                  e.target.style.display = 'none';
                                }}
                              />
                            </span>
                          );
                        }
                        
                        return (
                          <span className="inline-block my-2 max-w-md">
                            <Image 
                              src={imageUrl} 
                              alt={alt || 'Image'} 
                              width={400} 
                              height={300} 
                              className="rounded w-full h-auto shadow-sm border border-gray-200" 
                              unoptimized 
                              onError={(e) => {
                                console.error('Image load error:', imageUrl);
                              }}
                            />
                          </span>
                        );
                      },
                      table: ({node, ...props}) => <table className="border-collapse border border-gray-300 my-4" {...props} />,
                    th: ({node, ...props}) => <th className="border border-gray-300 px-4 py-2 bg-gray-100" {...props} />,
                    td: ({node, ...props}) => <td className="border border-gray-300 px-4 py-2" {...props} />,
                  }}
                >
                  {description || '*No description yet*'}
                </ReactMarkdown>
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {description.length}/10,000 characters
            </p>
          </div>

          {/* Include Abstain */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="abstain"
              checked={includeAbstain}
              onChange={(e) => {
                setIncludeAbstain(e.target.checked);
                // Limit choices if needed
                const maxChoices = e.target.checked ? 9 : 10;
                if (choices.length > maxChoices) {
                  setChoices(choices.slice(0, maxChoices));
                }
              }}
              className="rounded border-gray-300"
            />
            <Label htmlFor="abstain" className="cursor-pointer">
              Include Abstain option
            </Label>
          </div>

          {/* Choices */}
          <div className="space-y-2">
            <Label>Voting Choices *</Label>
            <div className="space-y-2">
              {choices.map((choice, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Choice ${index + 1}`}
                    value={choice}
                    onChange={(e) => updateChoice(index, e.target.value)}
                  />
                  {choices.length > 2 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeChoice(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {includeAbstain && (
                <div className="flex gap-2">
                  <Input
                    value="Abstain"
                    readOnly
                    className="bg-gray-100"
                  />
                </div>
              )}
            </div>
            {choices.length < (includeAbstain ? 9 : 10) && (
              <Button
                variant="outline"
                onClick={addChoice}
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Choice
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              {choices.length}/{includeAbstain ? 9 : 10} choices
            </p>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="startDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Start Date & Time
            </Label>
            <div className="relative">
              <Input
                id="startDate"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => document.getElementById('startDate').showPicker()}
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty to start immediately
            </p>
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label htmlFor="endDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              End Date & Time *
            </Label>
            <div className="relative">
              <Input
                id="endDate"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => document.getElementById('endDate').showPicker()}
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Eligibility Type */}
          <div className="space-y-2">
            <Label htmlFor="eligibility">Eligibility Type</Label>
            <select
              id="eligibility"
              value={eligibilityType}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setEligibilityType(value);
                if (value === 0) {
                  // Public: reset to non-weighted and clear token requirements
                  setProposalType(0);
                  setEligibilityToken('0x0000000000000000000000000000000000000000');
                  setEligibilityThreshold('0');
                } else {
                  setEligibilityThreshold('1');
                }
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value={0}>Public</option>
              <option value={1}>Token Holder</option>
            </select>
          </div>

          {/* Proposal Type */}
          <div className="space-y-2">
            <Label htmlFor="proposalType">Proposal Type</Label>
            <select
              id="proposalType"
              value={proposalType}
              onChange={(e) => setProposalType(parseInt(e.target.value))}
              disabled={eligibilityType === 0}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value={0}>Non-Weighted Single Choice</option>
              <option value={1}>Weighted Single Choice</option>
              <option value={2}>Weighted Fractional</option>
            </select>
            {eligibilityType === 0 && (
              <p className="text-xs text-muted-foreground">
                Only non-weighted voting is available for public proposals
              </p>
            )}
          </div>

          {/* Token Requirements (only for Token Holder eligibility) */}
          {eligibilityType === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="token">Eligibility Token Address</Label>
                <Input
                  id="token"
                  placeholder="0x..."
                  value={eligibilityToken}
                  onChange={(e) => setEligibilityToken(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="threshold">Eligibility Threshold</Label>
                <Input
                  id="threshold"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Minimum token balance"
                  value={eligibilityThreshold}
                  onChange={(e) => setEligibilityThreshold(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Passing Threshold */}
          <div className="space-y-2">
            <Label htmlFor="passing">Passing Threshold (%)</Label>
            <Input
              id="passing"
              type="number"
              min="1"
              max="100"
              value={passingThreshold}
              onChange={(e) => setPassingThreshold(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Percentage of votes the winning choice must receive to pass
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={() => saveDraft(false)}
              disabled={isSaving || !title.trim()}
              className="gap-2"
              variant="outline"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button
              onClick={publishProposal}
              disabled={isPublishing || !title.trim() || !description.trim()}
              className="gap-2 flex-1"
            >
              <Send className="h-4 w-4" />
              {isPublishing ? 'Publishing...' : 'Publish Proposal'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
