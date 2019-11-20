import { Component, Input, OnInit } from '@angular/core';
import { ignoreModalClose } from 'yti-common-ui/utils/modal';
import { NgbTabset } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject } from 'rxjs';
import { MessagingResource } from '../../entities-messaging/messaging-resource';
import { MessagingService } from '../../services/messaging-service';
import { UserService } from 'yti-common-ui/services/user.service';
import { LanguageService } from '../../services/languageService';
import { ConfirmationModalService } from 'yti-common-ui/components/confirmation-modal.component';
import { ErrorModalService } from 'yti-common-ui/components/error-modal.component';
import { ConfigServiceWrapper } from '../../ajs-upgraded-providers';
import { Config } from '../../entities/config';

@Component({
  selector: 'app-user-details-subscriptions',
  styleUrls: ['./user-details-subscriptions.component.scss'],
  templateUrl: './user-details-subscriptions.component.html',
})
export class UserDetailsSubscriptionsComponent implements OnInit {

  @Input() tabSet: NgbTabset;

  messagingResources$ = new BehaviorSubject<Map<string, MessagingResource[]> | null>(null);
  subscriptionType: string;
  loading = true;

  APPLICATION_CODELIST = 'codelist';
  APPLICATION_TERMINOLOGY = 'terminology';
  APPLICATION_DATAMODEL = 'datamodel';
  APPLICATION_COMMENTS = 'comments';

  config: Config;

  constructor(public languageService: LanguageService,
              private messagingService: MessagingService,
              private configServiceWrapper: ConfigServiceWrapper,
              private userService: UserService,
              private confirmationModalService: ConfirmationModalService,
              private errorModalService: ErrorModalService) {
    console.log('User details constructor!');
  }

  ngOnInit() {

    this.configServiceWrapper.configService.getConfig()
      .then(config => {
        this.config = config
        if (this.config.isMessagingEnabled && !this.userService.user.anonymous) {
          this.getUserSubscriptionData();
        } else {
          this.loading = false;
        }
      });
  }

  getUserSubscriptionData() {

    this.loading = true;

    this.messagingService.getMessagingUserData().subscribe(messagingUserData => {
      if (messagingUserData) {
        this.subscriptionType = messagingUserData.subscriptionType;
        const resources = new Map<string, MessagingResource[]>();
        const codelistMessagingResources: MessagingResource[] = [];
        const datamodelMessagingResources: MessagingResource[] = [];
        const terminologyMessagingResources: MessagingResource[] = [];
        const commentsMessagingResources: MessagingResource[] = [];

        messagingUserData.resources.forEach(resource => {
          if (resource.application === this.APPLICATION_CODELIST) {
            codelistMessagingResources.push(resource);
          } else if (resource.application === this.APPLICATION_DATAMODEL) {
            datamodelMessagingResources.push(resource);
          } else if (resource.application === this.APPLICATION_TERMINOLOGY) {
            terminologyMessagingResources.push(resource);
          } else if (resource.application === this.APPLICATION_COMMENTS) {
            commentsMessagingResources.push(resource);
          }
        });
        if (codelistMessagingResources.length > 0) {
          resources.set(this.APPLICATION_CODELIST, codelistMessagingResources);
        }
        if (datamodelMessagingResources.length > 0) {
          resources.set(this.APPLICATION_DATAMODEL, datamodelMessagingResources);
        }
        if (terminologyMessagingResources.length > 0) {
          resources.set(this.APPLICATION_TERMINOLOGY, terminologyMessagingResources);
        }
        if (commentsMessagingResources.length > 0) {
          resources.set(this.APPLICATION_COMMENTS, commentsMessagingResources);
        }
        if (resources.size > 0) {
          this.messagingResources = resources;
        } else {
          this.messagingResources = null;
        }
      } else {
        this.messagingResources = null;
      }
      this.loading = false;
    });
  }

  get messagingResources(): Map<string, MessagingResource[]> | null {

    return this.messagingResources$.getValue();
  }

  set messagingResources(value: Map<string, MessagingResource[]> | null) {

    this.messagingResources$.next(value);
  }

  removeSubscription(resource: MessagingResource) {

    this.confirmationModalService.open('REMOVE EMAIL SUBSCRIPTION TO RESOURCE?', undefined, '')
      .then(() => {
        this.messagingService.deleteSubscription(resource.uri).subscribe(success => {
          if (success) {
            const messagingResources = this.messagingResources;
            if (messagingResources != null) {
              const resources = messagingResources.get(resource.application);
              if (resources != null) {
                const resourceIndex = resources.indexOf(resource, 0);
                if (resourceIndex > -1) {
                  resources.splice(resourceIndex, 1);
                }
                if (resources.length === 0) {
                  messagingResources.delete(resource.application);
                  this.messagingResources = messagingResources;
                }
                if (messagingResources.size === 0) {
                  this.tabSet.select('user_details_info_tab');
                }
              }
            }
          } else {
            this.errorModalService.open('Submit error', 'Subscription deletion failed.', null);
          }
        });
      }, ignoreModalClose);
  }

  get isSubscriptionEnabled(): boolean {

    return this.subscriptionType !== 'DISABLED';
  }

  toggleSubscription(event: Event) {

    event.preventDefault();
    const subscriptionTargetType = this.subscriptionType === 'DAILY' ? 'DISABLED' : 'DAILY';

    this.openToggleNotifications(subscriptionTargetType === 'DAILY')
      .then(() => {
        this.messagingService.setSubscriptionType(subscriptionTargetType).subscribe(messagingUserData => {
          this.subscriptionType = messagingUserData.subscriptionType;
        });
      }, ignoreModalClose);
  }

  openToggleNotifications(enable: boolean) {

    if (enable) {
      return this.confirmationModalService.open('ARE YOU SURE YOU WANT TO ENABLE THE NOTIFICATION EMAIL SUBSCRIPTION?', undefined, '');
    } else {
      return this.confirmationModalService.open('ARE YOU SURE YOU WANT TO DISABLE THE NOTIFICATION EMAIL SUBSCRIPTION?', undefined, '');
    }
  }

  getUriWithEnv(uri: string): string | null {

    return this.config.getUriWithEnv(uri);
  }
}