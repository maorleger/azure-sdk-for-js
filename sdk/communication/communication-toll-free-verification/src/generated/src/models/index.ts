/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 *
 * Code generated by Microsoft (R) AutoRest Code Generator.
 * Changes may cause incorrect behavior and will be lost if the code is regenerated.
 */

import * as coreClient from "@azure/core-client";

export interface CampaignBrief {
  /** Campaign Brief Id. */
  id: string;
  /** Campaign Brief status e.g. 'submitted', 'approved', etc */
  status?: CampaignBriefStatus;
  /**
   * Notes added to the Campaign Brief after being reviewed to help customer understand
   * review results and necessary follow up actions.
   */
  reviewNotes?: ReviewNote[];
  /** Date and time when the Campaign Brief was submitted. */
  submissionDate?: Date;
  /** Last date and time when the Campaign Brief status was updated. */
  statusUpdatedDate?: Date;
  /** Country code of the Campaign Brief */
  countryCode?: string;
  businessPointOfContact?: BusinessPointOfContact;
  businessInformation?: BusinessInformation;
  useCaseInfo?: UseCaseInfo;
  /** List of numbers provisioned for the Campaign e.g. 18881234567 */
  phoneNumbers?: string[];
  /** Estimated total messages per month. */
  estimatedMonthlyVolume?: EstimatedMonthlyVolume;
  /** Campaign opt in additional information - image URLs or opt in description. */
  additionalInformation?: string;
  /** A list of summarized data of attachments currently added to the Campaign Brief */
  attachments?: CampaignBriefAttachmentSummary[];
  optInDetails?: OptInDetails;
  multipleNumbersJustification?: string;
}

/** Holds a note about a Campaign Brief that has gone thru stages of review process. */
export interface ReviewNote {
  /** Note related to a Campaign Brief that may imply changes needed from the client. */
  message?: string;
  /** Date and time when the note was added to the Campaign Brief. */
  date?: Date;
}

export interface BusinessPointOfContact {
  /** First name of the contact at the business. */
  firstName?: string;
  /** Last name of the contact at the business. */
  lastName?: string;
  /** Phone number of the contact at the business. */
  phone?: string;
  /** Email of the contact at the business. */
  email?: string;
  address?: Address;
}

export interface Address {
  /** Address line 1. */
  addressLine1?: string;
  /** Address line 2. */
  addressLine2?: string;
  /** The Locality. That would be the City for US addresses, for example. */
  locality?: string;
  /** The Administrative Division. That would be the State for US addresses, for example. */
  administrativeDivision?: string;
  /** Postal code. */
  postalCode?: string;
  /** Country. */
  country?: string;
}

export interface BusinessInformation {
  /** Business Name. */
  companyName?: string;
  /** Url of corporate website. */
  companyUrl?: string;
  address?: Address;
}

export interface UseCaseInfo {
  /** Sample of messages that will be sent to customers via Sms. */
  sampleMessages?: string[];
  /** Use case the campaign will be sending messages for e.g. appointments, sweepstakes. */
  useCase?: CampaignBriefUseCaseType;
  /** Description of how the use case is used in the campaign. */
  useCaseSummary?: string;
}

/** A summary of Campaign Brief File Attachment data */
export interface CampaignBriefAttachmentSummary {
  /** Campaign Brief Attachment Id. */
  id?: string;
  /**
   * Attachment type describing the purpose of the attachment
   * e.g. 'callToAction', 'termsOfService'
   */
  type?: AttachmentType;
  /**
   * The name of the attached file
   * e.g. 'myFile01'
   */
  fileName?: string;
}

export interface OptInDetails {
  description?: string;
  options?: Option[];
}

export interface Option {
  type: Type;
  imageUrls?: string[];
}

/** The Communication Services error. */
export interface CommunicationErrorResponse {
  /** The Communication Services error. */
  error: CommunicationError;
}

/** The Communication Services error. */
export interface CommunicationError {
  /** The error code. */
  code: string;
  /** The error message. */
  message: string;
  /**
   * The error target.
   * NOTE: This property will not be serialized. It can only be populated by the server.
   */
  readonly target?: string;
  /**
   * Further details about specific errors that led to this error.
   * NOTE: This property will not be serialized. It can only be populated by the server.
   */
  readonly details?: CommunicationError[];
  /**
   * The inner error if any.
   * NOTE: This property will not be serialized. It can only be populated by the server.
   */
  readonly innerError?: CommunicationError;
}

/** A wrapper for a list of CampaignBrief entities. */
export interface CampaignBriefs {
  /** List of Campaign Briefs. */
  campaignBriefs?: CampaignBrief[];
  /** Represents the URL link to the next page. */
  nextLink?: string;
}

/** A wrapper for a list of CampaignBriefSummary entities. */
export interface CampaignBriefSummaries {
  /** List of Campaign Brief Summaries. */
  campaignBriefSummaries?: CampaignBriefSummary[];
  /** Represents the URL link to the next page. */
  nextLink?: string;
}

/** A summary of Campaign Brief data */
export interface CampaignBriefSummary {
  /** Campaign Brief Id. */
  id?: string;
  /** Country code of the Campaign Brief */
  countryCode?: string;
  /** Campaign Brief types e.g. 'tollfreeVerification' */
  briefType?: "tollfreeVerification";
  /** Campaign Brief status e.g. 'submitted', 'approved', etc */
  status?: CampaignBriefStatus;
  /** List of numbers provisioned for the Campaign e.g. 18881234567 */
  phoneNumbers?: string[];
}

/** A File Attachment for a Campaign Brief */
export interface CampaignBriefAttachment {
  /** Campaign Brief Attachment Id. */
  id: string;
  /**
   * Attachment type describing the purpose of the attachment
   * e.g. 'callToAction', 'termsOfService'
   */
  type: AttachmentType;
  /**
   * The name of the file being attached
   * e.g. 'myFile01'
   */
  fileName: string;
  /** File size in bytes. */
  fileSizeInBytes?: number;
  /**
   * The type of file being attached
   * e.g. 'pdf', 'jpg', 'png'
   */
  fileType: FileType;
  /** File content as base 64 encoded string */
  fileContentBase64: string;
}

/** A wrapper for a list of CampaignBriefAttachment entities. */
export interface CampaignBriefAttachments {
  /** List of Campaign Brief attachments. */
  attachments?: CampaignBriefAttachment[];
  /** Represents the URL link to the next page. */
  nextLink?: string;
}

/** Defines values for CampaignBriefStatus. */
export type CampaignBriefStatus =
  | "submitted"
  | "approved"
  | "updateRequested"
  | "draft"
  | "cancelled"
  | "denied";
/** Defines values for CampaignBriefUseCaseType. */
export type CampaignBriefUseCaseType =
  | "TwoFactorAuthentication"
  | "AppNotifications"
  | "Appointments"
  | "Auctions"
  | "AutoRepairServices"
  | "BankTransfers"
  | "Billing"
  | "BookingConfirmations"
  | "BusinessUpdates"
  | "CareerTraining"
  | "Chatbot"
  | "ConversationalOrAlerts"
  | "CourierServicesAndDeliveries"
  | "COVID19Alerts"
  | "EmergencyAlerts"
  | "EventsAndPlanning"
  | "FinancialServices"
  | "FraudAlerts"
  | "Fundraising"
  | "GeneralMarketing"
  | "GeneralSchoolUpdates"
  | "HealthcareAlerts"
  | "HousingCommunityUpdates"
  | "HROrStaffing"
  | "InsuranceServices"
  | "JobDispatch"
  | "LegalServices"
  | "Mixed"
  | "MotivationalReminders"
  | "NotaryNotifications"
  | "OrderNotifications"
  | "Political"
  | "Works"
  | "RealEstateServices"
  | "ReligiousServices"
  | "RepairAndDiagnosticsAlerts"
  | "RewardsProgram"
  | "Surveys"
  | "SystemAlerts"
  | "VotingReminders"
  | "WaitlistAlerts"
  | "WebinarReminders"
  | "WorkshopAlerts"
  | "Other";
/** Defines values for EstimatedMonthlyVolume. */
export type EstimatedMonthlyVolume =
  | "V10"
  | "V100"
  | "V1000"
  | "V10000"
  | "V100000"
  | "V250000"
  | "V500000"
  | "V750000"
  | "V1000000"
  | "V5000000"
  | "V10000000OrMore";
/** Defines values for AttachmentType. */
export type AttachmentType =
  | "optInSmsKeyword"
  | "optInIVR"
  | "optInPointOfSale"
  | "optInWebsite"
  | "optInPaperForm"
  | "optInOther"
  | "optInDescription";
/** Defines values for Type. */
export type Type =
  | "keywordSMS"
  | "website"
  | "interactiveVoiceResponse"
  | "pointOfSale"
  | "paperForm"
  | "other";
/** Defines values for FileType. */
export type FileType = "png" | "jpg" | "jpeg" | "pdf";

/** Optional parameters. */
export interface TollFreeVerificationUpsertCampaignBriefOptionalParams
  extends coreClient.OperationOptions {
  /** Data to create new a Campaign Brief or fields to update an existing Campaign Brief */
  body?: CampaignBrief;
}

/** Contains response data for the upsertCampaignBrief operation. */
export type TollFreeVerificationUpsertCampaignBriefResponse = CampaignBrief;

/** Optional parameters. */
export interface TollFreeVerificationDeleteCampaignBriefOptionalParams
  extends coreClient.OperationOptions {}

/** Optional parameters. */
export interface TollFreeVerificationGetCampaignBriefOptionalParams
  extends coreClient.OperationOptions {}

/** Contains response data for the getCampaignBrief operation. */
export type TollFreeVerificationGetCampaignBriefResponse = CampaignBrief;

/** Optional parameters. */
export interface TollFreeVerificationSubmitCampaignBriefOptionalParams
  extends coreClient.OperationOptions {}

/** Contains response data for the submitCampaignBrief operation. */
export type TollFreeVerificationSubmitCampaignBriefResponse = CampaignBrief;

/** Optional parameters. */
export interface TollFreeVerificationGetAllCampaignBriefsByCountryCodeOptionalParams
  extends coreClient.OperationOptions {
  /** An optional parameter for how many entries to skip, for pagination purposes. */
  skip?: number;
  /** An optional parameter for how many entries to return, for pagination purposes. */
  top?: number;
}

/** Contains response data for the getAllCampaignBriefsByCountryCode operation. */
export type TollFreeVerificationGetAllCampaignBriefsByCountryCodeResponse =
  CampaignBriefs;

/** Optional parameters. */
export interface TollFreeVerificationGetAllCampaignBriefSummariesOptionalParams
  extends coreClient.OperationOptions {
  /** An optional parameter for how many entries to skip, for pagination purposes. */
  skip?: number;
  /** An optional parameter for how many entries to return, for pagination purposes. */
  top?: number;
}

/** Contains response data for the getAllCampaignBriefSummaries operation. */
export type TollFreeVerificationGetAllCampaignBriefSummariesResponse =
  CampaignBriefSummaries;

/** Optional parameters. */
export interface TollFreeVerificationCreateOrReplaceCampaignBriefAttachmentOptionalParams
  extends coreClient.OperationOptions {
  /** File size in bytes. */
  fileSizeInBytes?: number;
}

/** Contains response data for the createOrReplaceCampaignBriefAttachment operation. */
export type TollFreeVerificationCreateOrReplaceCampaignBriefAttachmentResponse =
  CampaignBriefAttachment;

/** Optional parameters. */
export interface TollFreeVerificationDeleteCampaignBriefAttachmentOptionalParams
  extends coreClient.OperationOptions {}

/** Optional parameters. */
export interface TollFreeVerificationGetCampaignBriefAttachmentOptionalParams
  extends coreClient.OperationOptions {}

/** Contains response data for the getCampaignBriefAttachment operation. */
export type TollFreeVerificationGetCampaignBriefAttachmentResponse =
  CampaignBriefAttachment;

/** Optional parameters. */
export interface TollFreeVerificationGetCampaignBriefAttachmentsOptionalParams
  extends coreClient.OperationOptions {
  /** An optional parameter for how many entries to skip, for pagination purposes. */
  skip?: number;
  /** An optional parameter for how many entries to return, for pagination purposes. */
  top?: number;
}

/** Contains response data for the getCampaignBriefAttachments operation. */
export type TollFreeVerificationGetCampaignBriefAttachmentsResponse =
  CampaignBriefAttachments;

/** Optional parameters. */
export interface TollFreeVerificationGetAllCampaignBriefsByCountryCodeNextOptionalParams
  extends coreClient.OperationOptions {}

/** Contains response data for the getAllCampaignBriefsByCountryCodeNext operation. */
export type TollFreeVerificationGetAllCampaignBriefsByCountryCodeNextResponse =
  CampaignBriefs;

/** Optional parameters. */
export interface TollFreeVerificationGetAllCampaignBriefSummariesNextOptionalParams
  extends coreClient.OperationOptions {}

/** Contains response data for the getAllCampaignBriefSummariesNext operation. */
export type TollFreeVerificationGetAllCampaignBriefSummariesNextResponse =
  CampaignBriefSummaries;

/** Optional parameters. */
export interface TollFreeVerificationGetCampaignBriefAttachmentsNextOptionalParams
  extends coreClient.OperationOptions {}

/** Contains response data for the getCampaignBriefAttachmentsNext operation. */
export type TollFreeVerificationGetCampaignBriefAttachmentsNextResponse =
  CampaignBriefAttachments;

/** Optional parameters. */
export interface TollFreeVerificationClientOptionalParams
  extends coreClient.ServiceClientOptions {
  /** Api Version */
  apiVersion?: string;
  /** Overrides client endpoint. */
  endpoint?: string;
}
